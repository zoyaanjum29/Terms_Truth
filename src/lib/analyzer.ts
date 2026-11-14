import type { Finding, Severity } from './types';

interface Rule {
  category: string;
  severity: Severity;
  title: string;
  description: string;
  recommendation: string;
  patterns: RegExp[];
}

const rules: Rule[] = [
  {
    category: 'Arbitration',
    severity: 'critical',
    title: 'Forced Arbitration Clause',
    description:
      'You are being forced to resolve disputes through private arbitration rather than in court. This means you give up your right to a jury trial and class action lawsuit.',
    recommendation:
      'This severely limits your legal recourse. If you have a dispute, you cannot sue in court or join a class action. Consider whether you are comfortable with this restriction.',
    patterns: [
      /arbitration/i,
      /waive.{0,30}right.{0,30}trial/i,
      /class action.{0,20}waiv/i,
      /binding arbitration/i,
    ],
  },
  {
    category: 'Data Privacy',
    severity: 'critical',
    title: 'Broad Data Collection',
    description:
      'The service collects a wide range of personal data including browsing history, device information, location, and communications. Your data may be used beyond what is necessary for the service.',
    recommendation:
      'Check what data is actually collected and whether you can opt out. Consider using a secondary email address and limiting permissions.',
    patterns: [
      /collect.{0,40}(information|data).{0,40}(device|location|browsing|communications)/i,
      /we may collect.{0,60}(personal|your).{0,30}(information|data)/i,
      /tracking.{0,30}(technologies|pixels|cookies)/i,
      /third.{0,10}party.{0,20}(advertis|tracking|analyt)/i,
    ],
  },
  {
    category: 'Data Privacy',
    severity: 'critical',
    title: 'Data Sold to Third Parties',
    description:
      'Your personal data may be sold, shared, or licensed to third parties for advertising or other commercial purposes.',
    recommendation:
      'This is a major privacy concern. Look for opt-out mechanisms and consider whether the service is worth the privacy trade-off.',
    patterns: [
      /sell.{0,30}(your|personal).{0,10}(data|information)/i,
      /share.{0,30}(your|personal).{0,10}(data|information).{0,30}third/i,
      /license.{0,30}(your|personal).{0,10}(data|information)/i,
      /transfer.{0,30}(your|personal).{0,10}(data|information).{0,30}third/i,
    ],
  },
  {
    category: 'Account Termination',
    severity: 'warning',
    title: 'Account Deletion Without Notice',
    description:
      'The service can delete your account or terminate your access at any time, for any reason, without prior notice.',
    recommendation:
      'Do not rely on this service for anything important. Keep backups of your data and be prepared for sudden account loss.',
    patterns: [
      /terminate.{0,30}(your|your).{0,20}(account|access).{0,30}(any time|without notice|at our discretion)/i,
      /suspend.{0,20}(or|and).{0,20}terminate.{0,30}(any time|without notice)/i,
      /reserve.{0,20}right.{0,30}terminate.{0,30}(any time|without notice|at our sole discretion)/i,
      /delete.{0,20}your.{0,10}(account|content).{0,30}(any time|without notice)/i,
    ],
  },
  {
    category: 'Content Ownership',
    severity: 'critical',
    title: 'You Grant Broad Content License',
    description:
      'By posting content, you grant the service a broad license to use, reproduce, modify, distribute, and create derivative works from your content — often royalty-free and perpetual.',
    recommendation:
      'Think carefully before uploading original work. The service may use your content commercially without compensating you.',
    patterns: [
      /grant.{0,20}(us|the company|the service).{0,40}(license|right).{0,40}(use|reproduce|modify|distribute)/i,
      /royalty.?free/i,
      /perpetual.{0,30}license/i,
      /irrevocable.{0,30}license/i,
      /derivative works/i,
      /worldwide.{0,30}license/i,
    ],
  },
  {
    category: 'Liability',
    severity: 'critical',
    title: 'Liability Cap Protects the Company',
    description:
      'The service limits its financial liability to a minimal amount (often just what you paid), meaning you cannot recover meaningful damages if you are harmed.',
    recommendation:
      'If the service causes you financial loss, your ability to recover damages is severely limited. Be cautious with services that handle sensitive data or money.',
    patterns: [
      /liability.{0,30}(shall not|will not|limited to).{0,30}(amount|dollars|\$|what you paid)/i,
      /limitation of liability/i,
      /not.{0,20}liable.{0,30}(indirect|incidental|consequential|punitive)/i,
      /aggregate liability.{0,30}(limited|not exceed)/i,
    ],
  },
  {
    category: 'Pricing',
    severity: 'warning',
    title: 'Price Changes Without Notice',
    description:
      'The service can change its pricing at any time, and continued use may be considered acceptance of the new price.',
    recommendation:
      'Monitor your billing statements. Cancel promptly if prices increase and you do not agree to the new terms.',
    patterns: [
      /change.{0,20}(prices|fees|pricing).{0,30}(any time|without notice)/i,
      /modify.{0,20}(prices|fees).{0,30}(any time|without notice)/i,
      /continued.{0,20}use.{0,20}(acceptance|agreed).{0,20}(new|changed).{0,10}(price|fee)/i,
    ],
  },
  {
    category: 'Automatic Renewal',
    severity: 'warning',
    title: 'Auto-Renewal Subscription',
    description:
      'Your subscription will automatically renew at the end of each billing period. You must actively cancel to stop being charged.',
    recommendation:
      'Set a calendar reminder before each renewal date. Check the cancellation policy and make sure you know how to opt out.',
    patterns: [
      /automatically.{0,20}renew/i,
      /auto.?renew/i,
      /recurring.{0,10}(billing|payment|charge)/i,
      /unless.{0,20}(you|we).{0,20}cancel/i,
    ],
  },
  {
    category: 'Content Removal',
    severity: 'warning',
    title: 'Content Removed Without Notice',
    description:
      'The service can remove your content at any time without notifying you, for reasons that may be subjective or discretionary.',
    recommendation:
      'Keep your own copies of anything important. Do not use this service as your only storage for valuable content.',
    patterns: [
      /remove.{0,20}your.{0,10}(content|post|material).{0,30}(any time|without notice|at our discretion)/i,
      /delete.{0,20}your.{0,10}(content|post|material).{0,30}(any time|without notice)/i,
      /right.{0,20}(to|to).{0,10}(remove|delete|modify).{0,20}(any|your).{0,10}(content|post|material)/i,
    ],
  },
  {
    category: 'Indemnification',
    severity: 'warning',
    title: 'You Must Indemnify the Company',
    description:
      'You are required to cover the company\'s legal costs and damages if they are sued because of your actions or content — even if you did not intend harm.',
    recommendation:
      'This shifts legal risk from the company to you. Be careful about what you post and do on the platform.',
    patterns: [
      /indemnif/i,
      /hold harmless/i,
      /you.{0,20}(agree|will).{0,20}(indemnify|defend|hold harmless)/i,
    ],
  },
  {
    category: 'Privacy',
    severity: 'warning',
    title: 'Vague Privacy Policy Reference',
    description:
      'The terms reference a separate privacy policy without explaining key data practices inline. Important privacy details may be buried in a separate document.',
    recommendation:
      'Find and read the linked privacy policy. Do not assume your data is protected just because a policy exists.',
    patterns: [
      /privacy policy/i,
      /see.{0,20}privacy/i,
      /refer.{0,20}privacy/i,
    ],
  },
  {
    category: 'Unilateral Changes',
    severity: 'critical',
    title: 'Terms Can Change at Any Time',
    description:
      'The service can modify these terms at any time without directly notifying you. Continued use after changes means you accept the new terms.',
    recommendation:
      'Check the terms periodically for changes. The company may add unfavorable clauses without alerting you.',
    patterns: [
      /change.{0,20}(these|the).{0,10}(terms|agreement).{0,30}(any time|without notice|at our discretion)/i,
      /modify.{0,20}(these|the).{0,10}(terms|agreement).{0,30}(any time|without notice)/i,
      /update.{0,20}(these|the).{0,10}(terms|agreement).{0,30}(any time|without notice)/i,
      /continued.{0,20}use.{0,30}(constitutes|means).{0,20}(acceptance|agreement)/i,
    ],
  },
  {
    category: 'Data Retention',
    severity: 'warning',
    title: 'Data Retained After Account Closure',
    description:
      'The service may keep your personal data even after you close your account, for an indefinite or extended period.',
    recommendation:
      'Ask about data deletion options before signing up. Closing your account may not actually erase your data.',
    patterns: [
      /retain.{0,30}(your|personal).{0,10}(data|information).{0,30}(after|following|closure|deletion)/i,
      /keep.{0,20}(your|personal).{0,10}(data|information).{0,20}(after|following)/i,
      /retention.{0,20}(period|policy).{0,20}(indefinite|as necessary|as required)/i,
    ],
  },
  {
    category: 'Jurisdiction',
    severity: 'info',
    title: 'Specific Legal Jurisdiction',
    description:
      'Disputes will be governed by the laws of a specific state or country, which may be far from where you live.',
    recommendation:
      'If you need to take legal action, you may need to do so in the specified jurisdiction, which could be inconvenient or expensive.',
    patterns: [
      /governed by.{0,30}(the laws of|laws of)/i,
      /jurisdiction.{0,20}(of|in)/i,
      /courts.{0,20}(of|in).{0,20}(state|county|country)/i,
    ],
  },
  {
    category: 'Age Requirements',
    severity: 'info',
    title: 'Age Restriction Noted',
    description:
      'The service specifies a minimum age requirement for users. Using the service if you are below this age may violate the terms.',
    recommendation:
      'Verify the age requirement. If the service is used by minors, a parent or guardian should review the terms.',
    patterns: [
      /(\d+).{0,10}(years of age|years old)/i,
      /minimum age/i,
      /must be.{0,10}(at least|over).{0,10}\d+/i,
    ],
  },
  {
    category: 'Cookies',
    severity: 'info',
    title: 'Cookie and Tracking Technology Use',
    description:
      'The service uses cookies and similar tracking technologies to monitor your behavior and personalize content or ads.',
    recommendation:
      'Check your browser settings to manage cookies. Consider using privacy-focused browser extensions to limit tracking.',
    patterns: [
      /cookies/i,
      /web beacons/i,
      /tracking pixels/i,
      /local storage/i,
    ],
  },
  {
    category: 'Warranty',
    severity: 'warning',
    title: 'Service Provided "As Is"',
    description:
      'The service is provided without any warranties. The company makes no promises about reliability, security, or fitness for a particular purpose.',
    recommendation:
      'Do not rely on this service for critical tasks. There are no guarantees it will work as expected or be available when you need it.',
    patterns: [
      /as is/i,
      /as available/i,
      /without warrant/i,
      /no.{0,10}(warranties|guarantee)/i,
    ],
  },
  {
    category: 'Third-Party Links',
    severity: 'info',
    title: 'Third-Party Services Not Covered',
    description:
      'The service may link to or integrate with third-party services that have their own terms. The company is not responsible for those services.',
    recommendation:
      'Be aware that interacting with third-party services through this platform may subject you to different terms and privacy practices.',
    patterns: [
      /third.?party.{0,20}(services|websites|links|content)/i,
      /not responsible.{0,30}third/i,
      /external.{0,10}(links|sites)/i,
    ],
  },
];

function findExcerpt(text: string, pattern: RegExp): string {
  const match = text.match(pattern);
  if (!match) return '';
  const idx = match.index ?? 0;
  const start = Math.max(0, idx - 60);
  const end = Math.min(text.length, idx + match[0].length + 60);
  let excerpt = text.slice(start, end).trim();
  if (start > 0) excerpt = '…' + excerpt;
  if (end < text.length) excerpt = excerpt + '…';
  return excerpt;
}

export interface AnalysisResult {
  score: number;
  grade: string;
  summary: string;
  findings: Omit<Finding, 'id' | 'analysis_id' | 'created_at'>[];
  wordCount: number;
  criticalCount: number;
  warningCount: number;
  infoCount: number;
}

export function analyzeTerms(text: string, title: string): AnalysisResult {
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
  const seenCategories = new Set<string>();
  const findings: Omit<Finding, 'id' | 'analysis_id' | 'created_at'>[] = [];

  for (const rule of rules) {
    for (const pattern of rule.patterns) {
      if (pattern.test(text)) {
        const dedupeKey = `${rule.category}-${rule.title}`;
        if (seenCategories.has(dedupeKey)) break;
        seenCategories.add(dedupeKey);
        findings.push({
          category: rule.category,
          severity: rule.severity,
          title: rule.title,
          description: rule.description,
          excerpt: findExcerpt(text, pattern),
          recommendation: rule.recommendation,
        });
        break;
      }
    }
  }

  const criticalCount = findings.filter((f) => f.severity === 'critical').length;
  const warningCount = findings.filter((f) => f.severity === 'warning').length;
  const infoCount = findings.filter((f) => f.severity === 'info').length;

  let score = 100;
  score -= criticalCount * 18;
  score -= warningCount * 8;
  score -= infoCount * 2;
  if (wordCount < 50) score -= 10;
  score = Math.max(0, Math.min(100, score));

  let grade: string;
  if (score >= 85) grade = 'A';
  else if (score >= 70) grade = 'B';
  else if (score >= 55) grade = 'C';
  else if (score >= 40) grade = 'D';
  else grade = 'F';

  const summaryParts: string[] = [];
  if (criticalCount > 0) {
    summaryParts.push(
      `${criticalCount} critical issue${criticalCount > 1 ? 's' : ''} found`,
    );
  }
  if (warningCount > 0) {
    summaryParts.push(
      `${warningCount} warning${warningCount > 1 ? 's' : ''}`,
    );
  }
  if (infoCount > 0) {
    summaryParts.push(`${infoCount} informational note${infoCount > 1 ? 's' : ''}`);
  }

  let summary: string;
  if (findings.length === 0) {
    summary = `No significant red flags detected in "${title}". The terms appear relatively standard, but this does not constitute legal advice. Always review carefully.`;
  } else {
    summary = `"${title}" contains ${summaryParts.join(', ')}. `;
    if (criticalCount > 0) {
      summary += `This document has clauses that could significantly limit your rights. `;
    }
    if (grade === 'A' || grade === 'B') {
      summary += `Overall, the terms are relatively fair but contain some provisions to be aware of.`;
    } else if (grade === 'C') {
      summary += `The terms are average — some clauses warrant attention before agreeing.`;
    } else {
      summary += `The terms contain concerning provisions. Review carefully before agreeing.`;
    }
  }

  return {
    score,
    grade,
    summary,
    findings,
    wordCount,
    criticalCount,
    warningCount,
    infoCount,
  };
}
