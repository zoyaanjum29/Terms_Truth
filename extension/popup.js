import { CONFIG } from './config.js';

// DOM Elements
const views = {
  detecting: document.getElementById('view-detecting'),
  notDetected: document.getElementById('view-not-detected'),
  ready: document.getElementById('view-ready'),
  loading: document.getElementById('view-loading'),
  results: document.getElementById('view-results'),
  error: document.getElementById('view-error'),
};

const statusPill = document.getElementById('status-pill');
const readyDocTitle = document.getElementById('ready-doc-title');
const readyWordCount = document.getElementById('ready-word-count');
const btnStartAnalyze = document.getElementById('btn-start-analyze');
const btnForceScan = document.getElementById('btn-force-scan');
const resultsDocTitle = document.getElementById('results-doc-title');
const resultsSummaryBadge = document.getElementById('results-summary-badge');
const primaryFindingsList = document.getElementById('primary-findings-list');
const remainingContainer = document.getElementById('remaining-container');
const remainingCount = document.getElementById('remaining-count');
const remainingFindingsList = document.getElementById('remaining-findings-list');
const btnToggleRemaining = document.getElementById('btn-toggle-remaining');
const btnRescan = document.getElementById('btn-rescan');
const linkDashboard = document.getElementById('link-dashboard');
const errorMessage = document.getElementById('error-message');
const btnRetry = document.getElementById('btn-retry');

let currentExtraction = null;
let currentHash = null;

// Switch active view
function switchView(viewName) {
  Object.keys(views).forEach((name) => {
    if (views[name]) {
      if (name === viewName) {
        views[name].classList.remove('hidden');
      } else {
        views[name].classList.add('hidden');
      }
    }
  });
}

// Compute SHA-256 hash for cache deduplication
async function computeHash(text) {
  const normalized = text.trim().replace(/\s+/g, ' ').toLowerCase();
  const msgBuffer = new TextEncoder().encode(normalized);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Extractor function injected into the target tab via chrome.scripting
function extractPageAgreementInTab(maxChars) {
  // 1. Check if the user has highlighted text on the page
  const selection = window.getSelection() ? window.getSelection().toString().trim() : '';
  if (selection && selection.length >= 20) {
    const wordCount = selection.split(/\s+/).filter(Boolean).length;
    return {
      title: document.title || 'Selected Agreement Text',
      text: selection.slice(0, maxChars),
      wordCount,
      url: window.location.href,
      isSelection: true,
      isLikelyAgreement: true,
    };
  }

  // 2. Clone body to safely clean boilerplate without altering the live page
  const bodyClone = document.body.cloneNode(true);

  // Remove non-content elements
  const removeSelectors = [
    'script', 'style', 'noscript', 'header', 'footer', 'nav', 'aside',
    'form', 'button', 'input', 'select', 'textarea',
    '[role="banner"]', '[role="navigation"]', '[aria-hidden="true"]',
    '.cookie-banner', '#cookie-banner', '.nav', '.footer', '.header'
  ];
  removeSelectors.forEach((sel) => {
    bodyClone.querySelectorAll(sel).forEach((el) => el.remove());
  });

  // 3. Search for primary article or agreement container
  const candidateSelectors = [
    'main', 'article', '[role="main"]',
    '.terms', '#terms', '.privacy', '#privacy', '.legal', '#legal',
    '.tos-content', '.terms-content', '.policy-content', '.document-content',
    '.entry-content', '.markdown-body', '.content'
  ];

  let bestContainer = null;
  for (const sel of candidateSelectors) {
    const el = bodyClone.querySelector(sel);
    if (el && el.innerText && el.innerText.trim().length > 300) {
      bestContainer = el;
      break;
    }
  }

  const rawText = (bestContainer || bodyClone).innerText || '';
  const cleanedText = rawText.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim();
  const wordCount = cleanedText.split(/\s+/).filter(Boolean).length;

  // 4. Determine title
  let detectedTitle = '';
  const h1 = document.querySelector('h1');
  if (h1 && h1.innerText && h1.innerText.trim().length > 3 && h1.innerText.trim().length < 100) {
    detectedTitle = h1.innerText.trim();
  } else if (document.title) {
    detectedTitle = document.title.split(/[-|•–]/)[0].trim();
  }
  if (!detectedTitle) {
    detectedTitle = window.location.hostname + ' Agreement';
  }

  // Check agreement indicators
  const pageUrl = window.location.href.toLowerCase();
  const pageTitle = (document.title || '').toLowerCase();
  const isLikely =
    pageUrl.includes('terms') ||
    pageUrl.includes('tos') ||
    pageUrl.includes('privacy') ||
    pageUrl.includes('legal') ||
    pageUrl.includes('eula') ||
    pageUrl.includes('agreement') ||
    pageUrl.includes('policy') ||
    pageTitle.includes('terms') ||
    pageTitle.includes('privacy') ||
    pageTitle.includes('agreement') ||
    pageTitle.includes('policy') ||
    wordCount >= 200;

  return {
    title: detectedTitle,
    text: cleanedText.slice(0, maxChars),
    wordCount,
    url: window.location.href,
    isSelection: false,
    isLikelyAgreement: isLikely,
  };
}

// Fallback broad text extractor
function extractBroadBodyText(maxChars) {
  const text = (document.body.innerText || '').trim();
  return {
    title: document.title || 'Page Agreement Text',
    text: text.slice(0, maxChars),
    wordCount: text.split(/\s+/).filter(Boolean).length,
    url: window.location.href,
    isSelection: false,
    isLikelyAgreement: true,
  };
}

// Execute script in active tab
async function extractFromTab(broadFallback = false) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab || !tab.id) {
    throw new Error('No active browser tab found.');
  }

  // Check restricted URLs (chrome://, edge://, about:)
  if (tab.url && (tab.url.startsWith('chrome://') || tab.url.startsWith('edge://') || tab.url.startsWith('about:'))) {
    throw new Error('TermsTruth cannot inspect internal browser pages.');
  }

  const funcToRun = broadFallback ? extractBroadBodyText : extractPageAgreementInTab;
  const results = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    func: funcToRun,
    args: [CONFIG.MAX_EXTRACT_CHARS],
  });

  if (!results || !results[0] || !results[0].result) {
    throw new Error('Failed to read page text.');
  }

  return results[0].result;
}

// Call the Supabase Edge Function
async function callAnalyzeEdgeFunction(text, title) {
  const endpoint = `${CONFIG.SUPABASE_URL}/functions/v1/analyze-agreement`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${CONFIG.SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify({
      text,
      title: title || 'Untitled Agreement',
    }),
  });

  if (!response.ok) {
    let msg = `Service returned error (status ${response.status})`;
    try {
      const errJson = await response.json();
      if (errJson && errJson.error) {
        msg = errJson.error;
      }
    } catch {
      // response wasn't JSON
    }
    throw new Error(msg);
  }

  const data = await response.json();
  if (!data || !Array.isArray(data.findings)) {
    throw new Error('Analysis service returned an invalid response structure.');
  }

  return data;
}

// Render Finding Card element
function renderFindingCard(finding) {
  const card = document.createElement('div');
  const severityClass =
    finding.severity === 'critical'
      ? 'severity-critical'
      : finding.severity === 'warning'
        ? 'severity-warning'
        : 'severity-info';

  card.className = `tt-finding-card ${severityClass}`;

  const attentionLabel =
    finding.attention_level === 'High'
      ? 'High Attention'
      : finding.attention_level === 'Medium'
        ? 'Medium Attention'
        : 'Informational';

  const badgeClass =
    finding.attention_level === 'High'
      ? 'tt-badge-high'
      : finding.attention_level === 'Medium'
        ? 'tt-badge-medium'
        : 'tt-badge-low';

  card.innerHTML = `
    <div class="tt-finding-header">
      <span class="tt-finding-title">${escapeHtml(finding.title)}</span>
      <span class="tt-finding-chip ${badgeClass}">${attentionLabel}</span>
    </div>
    <p class="tt-finding-desc">${escapeHtml(finding.description)}</p>
    ${
      finding.excerpt
        ? `
      <button type="button" class="tt-clause-toggle">
        <span class="toggle-icon">▸</span> View original clause
      </button>
      <blockquote class="tt-clause-quote hidden">
        &ldquo;${escapeHtml(finding.excerpt)}&rdquo;
      </blockquote>
    `
        : ''
    }
  `;

  // Toggle quote
  const toggleBtn = card.querySelector('.tt-clause-toggle');
  const quoteEl = card.querySelector('.tt-clause-quote');
  if (toggleBtn && quoteEl) {
    toggleBtn.addEventListener('click', () => {
      const isHidden = quoteEl.classList.contains('hidden');
      if (isHidden) {
        quoteEl.classList.remove('hidden');
        toggleBtn.querySelector('.toggle-icon').textContent = '▾';
      } else {
        quoteEl.classList.add('hidden');
        toggleBtn.querySelector('.toggle-icon').textContent = '▸';
      }
    });
  }

  return card;
}

// Render Results View
function displayResults(data, isCached = false) {
  if (isCached) {
    statusPill.textContent = 'Cached';
    statusPill.className = 'tt-pill tt-pill-cached';
    statusPill.classList.remove('hidden');
  } else {
    statusPill.classList.add('hidden');
  }

  resultsDocTitle.textContent = currentExtraction.title || 'Agreement Analysis';

  // Overall badge
  const critical = data.criticalCount || 0;
  const warning = data.warningCount || 0;
  if (critical > 0) {
    resultsSummaryBadge.textContent = `${critical} High Attention`;
    resultsSummaryBadge.className = 'tt-badge tt-badge-high';
  } else if (warning > 0) {
    resultsSummaryBadge.textContent = `${warning} Medium Attention`;
    resultsSummaryBadge.className = 'tt-badge tt-badge-medium';
  } else {
    resultsSummaryBadge.textContent = 'No major concerns detected';
    resultsSummaryBadge.className = 'tt-badge tt-badge-low';
  }

  // Sort findings: High first, then Medium, then Low
  const priorityOrder = { High: 3, Medium: 2, Low: 1 };
  const sortedFindings = [...data.findings].sort((a, b) => {
    const aVal = priorityOrder[a.attention_level] || 1;
    const bVal = priorityOrder[b.attention_level] || 1;
    return bVal - aVal;
  });

  // Top 1-2 findings
  const primaryFindings = sortedFindings.slice(0, 2);
  const remainingFindings = sortedFindings.slice(2);

  primaryFindingsList.innerHTML = '';
  primaryFindings.forEach((f) => {
    primaryFindingsList.appendChild(renderFindingCard(f));
  });

  if (remainingFindings.length > 0) {
    remainingContainer.classList.remove('hidden');
    remainingCount.textContent = remainingFindings.length;
    remainingFindingsList.innerHTML = '';
    remainingFindings.forEach((f) => {
      remainingFindingsList.appendChild(renderFindingCard(f));
    });

    btnToggleRemaining.onclick = () => {
      const isHidden = remainingFindingsList.classList.contains('hidden');
      if (isHidden) {
        remainingFindingsList.classList.remove('hidden');
        btnToggleRemaining.textContent = '- Hide additional clauses';
      } else {
        remainingFindingsList.classList.add('hidden');
        btnToggleRemaining.textContent = `+ View ${remainingFindings.length} more identified clauses`;
      }
    };
  } else {
    remainingContainer.classList.add('hidden');
  }

  linkDashboard.href = CONFIG.DASHBOARD_URL;

  switchView('results');
}

// Perform analysis flow
async function runAnalysis(forceFresh = false) {
  if (!currentExtraction || currentExtraction.text.length < 20) {
    switchView('notDetected');
    return;
  }

  const cacheKey = CONFIG.CACHE_PREFIX + currentHash;

  // Check cache unless forced fresh
  if (!forceFresh) {
    try {
      const cached = await chrome.storage.local.get([cacheKey]);
      if (cached && cached[cacheKey] && cached[cacheKey].result) {
        displayResults(cached[cacheKey].result, true);
        return;
      }
    } catch (err) {
      console.warn('Cache lookup failed, proceeding with fresh call:', err);
    }
  }

  // Fresh Analysis
  switchView('loading');
  try {
    const result = await callAnalyzeEdgeFunction(
      currentExtraction.text,
      currentExtraction.title
    );

    // Save exclusively in chrome.storage.local (never in public database)
    await chrome.storage.local.set({
      [cacheKey]: {
        result,
        title: currentExtraction.title,
        url: currentExtraction.url,
        timestamp: Date.now(),
      },
    });

    displayResults(result, false);
  } catch (err) {
    console.error('TermsTruth analysis error:', err);
    errorMessage.textContent = err.message || 'Analysis failed. Please try again.';
    switchView('error');
  }
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Initialize popup on open
async function initPopup() {
  switchView('detecting');
  try {
    const extraction = await extractFromTab(false);
    currentExtraction = extraction;

    if (!extraction.text || extraction.text.length < 20) {
      switchView('notDetected');
      return;
    }

    currentHash = await computeHash(extraction.text);
    const cacheKey = CONFIG.CACHE_PREFIX + currentHash;

    // Fast-path: Check if already analyzed
    const cached = await chrome.storage.local.get([cacheKey]);
    if (cached && cached[cacheKey] && cached[cacheKey].result) {
      displayResults(cached[cacheKey].result, true);
      return;
    }

    // Ready to analyze
    readyDocTitle.textContent = extraction.title || 'Terms / Agreement';
    readyWordCount.textContent = `~${extraction.wordCount.toLocaleString()} words`;
    switchView('ready');
  } catch (err) {
    console.warn('Initial extraction notice:', err.message);
    switchView('notDetected');
  }
}

// Event Listeners
btnStartAnalyze.addEventListener('click', () => runAnalysis(false));
btnForceScan.addEventListener('click', async () => {
  switchView('detecting');
  try {
    const extraction = await extractFromTab(true);
    currentExtraction = extraction;
    if (extraction.text && extraction.text.length >= 20) {
      currentHash = await computeHash(extraction.text);
      readyDocTitle.textContent = extraction.title;
      readyWordCount.textContent = `~${extraction.wordCount.toLocaleString()} words`;
      switchView('ready');
    } else {
      errorMessage.textContent =
        'Could not find enough readable text on this page to analyze (minimum 20 characters required).';
      switchView('error');
    }
  } catch (err) {
    errorMessage.textContent = err.message || 'Failed to scan page text.';
    switchView('error');
  }
});

btnRescan.addEventListener('click', () => runAnalysis(true));
btnRetry.addEventListener('click', () => runAnalysis(false));

// Mount
document.addEventListener('DOMContentLoaded', initPopup);

