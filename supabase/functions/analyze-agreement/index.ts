import { createClient } from "npm:@supabase/supabase-js@2.57.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface AIFinding {
  category: string;
  clause_title: string;
  exact_evidence_quote: string;
  plain_english_explanation: string;
  why_it_matters: string;
  attention_level: "High" | "Medium" | "Low";
  certainty: "Explicit" | "Uncertain";
  recommendation: string;
  missing_information: string | null;
}

interface AnalysisResponse {
  summary: string;
  findings: AIFinding[];
}

const GEMINI_MODEL = "gemini-3.1-flash-lite";


const SYSTEM_PROMPT = `You are TermsTruth, an agreement-analysis assistant. Your purpose is to help ordinary users understand important provisions in terms of service, privacy policies, subscription agreements, and other online agreements.

Your analysis must be comprehensive, evidence-based, neutral, and understandable to a non-lawyer.

CORE PRINCIPLES:

1. EVIDENCE FIRST
- Every finding MUST contain an exact_evidence_quote copied word-for-word from the supplied agreement.
- Never invent, paraphrase, or reconstruct an evidence quote.
- Preserve the original wording and punctuation.
- If no exact supporting quotation exists, do not create that finding.
- Only report findings supported by the supplied text.

2. SYSTEMATIC DOCUMENT REVIEW
Before producing the final JSON, internally review the entire agreement section by section.
Do not stop after finding the first few important clauses.
Check every applicable category below and identify all distinct, meaningful provisions.

Review these categories:

A. PRIVACY AND DATA
- Personal information collected
- Sensitive information collected
- Browsing activity and tracking
- Third-party data sharing
- Data selling or advertising use
- Data retention periods
- Data deletion rights
- International data transfers
- Security and breach notifications

B. SUBSCRIPTIONS AND PAYMENTS
- Automatic subscription renewal
- Renewal frequency
- Recurring charges
- Free trials converting into paid plans
- Cancellation procedures
- Cancellation deadlines
- Refund restrictions
- Price changes
- Additional fees

C. USER RIGHTS AND DISPUTES
- Binding arbitration
- Class-action waivers
- Governing law and jurisdiction
- Complaint procedures
- Liability limitations
- Indemnification obligations
- Warranty disclaimers

D. CONTENT AND INTELLECTUAL PROPERTY
- Ownership of uploaded content
- Licences granted to the company
- Commercial use of user content
- AI training using user content
- Content moderation and removal

E. ACCOUNT AND SERVICE CONTROL
- Account suspension
- Account termination
- Unilateral service changes
- Policy modifications
- Notice requirements
- Service discontinuation
- User access restrictions

F. OTHER IMPORTANT TERMS
- Any other unusual, surprising, restrictive, or user-impactful provision.

Do not create findings for categories that are not supported by the agreement.

3. COMPLETENESS
- Identify every distinct important clause supported by the text.
- Do not arbitrarily limit the findings to three or five.
- Do not omit a meaningful clause merely because other findings appear more important.
- Automatic renewal and refund restrictions must be considered separately when both are present.
- If a single sentence contains two distinct user-impactful provisions, separate findings may be created when each can be supported by an exact quotation.
- Avoid duplicate findings describing the same provision.

4. ACCURATE EXPLANATIONS
- Explain the practical meaning in simple everyday English.
- Do not exaggerate or make unsupported assumptions.
- Never claim that a user has completely lost a legal right unless the text clearly supports that statement.
- For arbitration clauses, explain the dispute-resolution process and any class-action waiver separately.
- Do not claim that a clause is illegal, unenforceable, or legally valid.
- Do not provide legal advice.

5. CERTAINTY
- Explicit: the agreement directly states the provision.
- Uncertain: the wording is ambiguous or the interpretation depends on missing context.
- Do not label a directly stated clause Uncertain merely because its legal effect is unclear.
- Do not treat missing information as proof of misconduct.

6. ATTENTION LEVEL
- Do not automatically assign High attention to user-protective or beneficial clauses, such as confirming that users retain ownership of their content.
- High: a provision with significant practical consequences, substantial restrictions, recurring financial commitments, or meaningful privacy implications.
- Medium: a provision that deserves attention but has more limited consequences.
- Low: primarily informational or routine provisions.
- Base the level on the actual text, not dramatic wording.
- Attention level is informational and does not represent a legal judgment.

7. MISSING INFORMATION
- Use missing_information only when a notable detail is absent from the supplied agreement.
- Give a concise description of what is not specified.
- Do not imply that the company necessarily violates any requirement by omitting it.
- Otherwise return null.

8. SUMMARY
- Provide a neutral 2-3 sentence overview.
- Mention the most important user-impactful provisions.
- Do not claim that the agreement is safe, unsafe, fair, or unfair.

OUTPUT REQUIREMENTS:

9. CONCISE, USEFUL EXPLANATIONS
- plain_english_explanation: Use only 1–2 short, simple sentences. Explain the practical meaning instead of repeating the agreement.
- why_it_matters: Use only one short sentence explaining the real-world impact on the user.
- recommendation: Give one short, practical suggestion.
- Avoid unnecessary legal terminology and complicated wording.
- Do not repeat the same information across these three fields.
- Keep each finding easy to scan and understand.
- Prefer clarity over lengthy explanations.


Return ONLY valid JSON.
Do not include Markdown fences, introductory text, or commentary.

Use exactly this structure:

{
  "summary": "2-3 sentence plain-English overview",
  "findings": [
    {
      "category": "Short category label",
      "clause_title": "Descriptive clause title",
      "exact_evidence_quote": "Exact quotation from the supplied agreement",
      "plain_english_explanation": "Simple explanation",
      "why_it_matters": "Practical impact on the user",
      "attention_level": "High",
      "certainty": "Explicit",
      "recommendation": "Practical consideration for the user",
      "missing_information": null
    }
  ]
}

Allowed attention_level values: High, Medium, Low.
Allowed certainty values: Explicit, Uncertain.

If the input is empty, too short, or does not contain meaningful agreement text, return:
{
  "summary": "The provided text does not appear to be a meaningful legal agreement.",
  "findings": []
}

Final internal quality check before responding:
- Have you reviewed the entire supplied agreement?
- Have you identified every distinct important provision?
- Does every finding have an exact quotation?
- Are explanations faithful to those quotations?
- Are attention levels proportionate?
- Are there duplicates?
- Is the output valid JSON?

Return the completed JSON only.`;


function verifyQuoteExists(quote: string, sourceText: string): boolean {
  if (!quote || quote.trim().length === 0) return false;
  const normalizedQuote = quote.trim().replace(/\s+/g, " ").toLowerCase();
  const normalizedSource = sourceText.replace(/\s+/g, " ").toLowerCase();
  return normalizedSource.includes(normalizedQuote);
}

function cleanQuote(quote: string, sourceText: string): string {
  let cleaned = quote.trim();
  // Strip surrounding quotes that Gemini might add
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith("'") && cleaned.endsWith("'"))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

function validateFinding(f: unknown, sourceText: string): AIFinding | null {
  if (!f || typeof f !== "object") return null;
  const obj = f as Record<string, unknown>;

  const category = typeof obj.category === "string" ? obj.category : null;
  const clauseTitle =
    typeof obj.clause_title === "string" ? obj.clause_title : null;
  const rawQuote =
    typeof obj.exact_evidence_quote === "string"
      ? obj.exact_evidence_quote
      : null;
  const explanation =
    typeof obj.plain_english_explanation === "string"
      ? obj.plain_english_explanation
      : null;
  const whyItMatters =
    typeof obj.why_it_matters === "string" ? obj.why_it_matters : null;
  const attentionLevel = typeof obj.attention_level === "string"
    ? obj.attention_level
    : null;
  const certainty =
    typeof obj.certainty === "string" ? obj.certainty : null;
  const recommendation =
    typeof obj.recommendation === "string" ? obj.recommendation : null;
  const missingInfo =
    typeof obj.missing_information === "string"
      ? obj.missing_information
      : null;

  if (
    !category ||
    !clauseTitle ||
    !rawQuote ||
    !explanation ||
    !whyItMatters ||
    !recommendation
  ) {
    return null;
  }

  const cleanedQuote = cleanQuote(rawQuote, sourceText);
  if (!verifyQuoteExists(cleanedQuote, sourceText)) {
    return null;
  }

  const validAttention =
    attentionLevel === "High" || attentionLevel === "Medium"
      ? attentionLevel
      : "Low";
  const validCertainty =
    certainty === "Explicit" || certainty === "Uncertain"
      ? certainty
      : "Uncertain";

  return {
    category,
    clause_title: clauseTitle,
    exact_evidence_quote: cleanedQuote,
    plain_english_explanation: explanation,
    why_it_matters: whyItMatters,
    attention_level: validAttention as "High" | "Medium" | "Low",
    certainty: validCertainty as "Explicit" | "Uncertain",
    recommendation,
    missing_information: missingInfo || null,
  };
}

function mapAttentionToSeverity(
  attention: "High" | "Medium" | "Low",
): "critical" | "warning" | "info" {
  if (attention === "High") return "critical";
  if (attention === "Medium") return "warning";
  return "info";
}

function calculateScore(
  findings: AIFinding[],
  wordCount: number,
): { score: number; grade: string } {
  const critical = findings.filter((f) => f.attention_level === "High").length;
  const warning = findings.filter((f) => f.attention_level === "Medium").length;
  const info = findings.filter((f) => f.attention_level === "Low").length;

  let score = 100;
  score -= critical * 18;
  score -= warning * 8;
  score -= info * 2;
  if (wordCount < 50) score -= 10;
  score = Math.max(0, Math.min(100, score));

  let grade: string;
  if (score >= 85) grade = "A";
  else if (score >= 70) grade = "B";
  else if (score >= 55) grade = "C";
  else if (score >= 40) grade = "D";
  else grade = "F";

  return { score, grade };
}

function extractJsonFromResponse(text: string): unknown {
  // Try to find JSON in the response, handling markdown code fences
  let jsonText = text.trim();

  // Remove markdown code fences if present
  const fenceMatch = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fenceMatch) {
    jsonText = fenceMatch[1].trim();
  }

  // Find the first { and last } to extract the JSON object
  const firstBrace = jsonText.indexOf("{");
  const lastBrace = jsonText.lastIndexOf("}");
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error("AI response did not contain valid JSON");
  }
  jsonText = jsonText.slice(firstBrace, lastBrace + 1);

  return JSON.parse(jsonText);
}

function getClientIp(req: Request): string | null {
  // Supabase's Cloudflare gateway supplies this header.
  const ip = req.headers.get("cf-connecting-ip")?.trim();
  return ip || null;
}

async function hashIp(ip: string, salt: string): Promise<string> {
  const data = new TextEncoder().encode(`${salt}:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", data);

  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function getSupabaseSecretKey(): string | null {
  // Current Supabase projects provide named secret keys.
  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (secretKeysJson) {
    try {
      const keys = JSON.parse(secretKeysJson);
      if (typeof keys.default === "string") {
        return keys.default;
      }
    } catch {
      console.error("Could not read Supabase secret keys.");
    }
  }

  // Compatibility with older Supabase projects.
  return Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({
          error:
            "The AI analysis service is not configured. The GEMINI_API_KEY secret has not been set.",
        }),
        {
          status: 503,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const body = await req.json();
    const { text, title } = body as { text?: string; title?: string };

    if (!text || typeof text !== "string" || text.trim().length < 20) {
      return new Response(
        JSON.stringify({
          error:
            "Please provide agreement text with at least 20 characters to analyze.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseSecretKey = getSupabaseSecretKey();
const rateLimitSalt = Deno.env.get("RATE_LIMIT_SALT");
const clientIp = getClientIp(req);

if (!supabaseUrl || !supabaseSecretKey || !rateLimitSalt || !clientIp) {
  return new Response(
    JSON.stringify({
      error: "Security checks are not configured. Please try again later.",
    }),
    { status: 503, headers: corsHeaders },
  );
}

const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseSecretKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
);

const hashedIp = await hashIp(clientIp, rateLimitSalt);

const { data: ipAllowed, error: ipError } =
  await supabaseAdmin.rpc("consume_ip_rate_limit", {
    p_bucket_key: `ip:${hashedIp}`,
  });

if (ipError) {
  console.error("IP rate-limit check failed:", ipError.message);
  return new Response(
    JSON.stringify({ error: "Security check failed. Please try again later." }),
    { status: 503, headers: corsHeaders },
  );
}

if (ipAllowed !== true) {
  return new Response(
    JSON.stringify({ error: "Too many requests. Please try again in 10 minutes." }),
    { status: 429, headers: corsHeaders },
  );
}

const { data: dailyAllowed, error: dailyError } =
  await supabaseAdmin.rpc("consume_global_daily_limit");

if (dailyError) {
  console.error("Daily rate-limit check failed:", dailyError.message);
  return new Response(
    JSON.stringify({ error: "Security check failed. Please try again later." }),
    { status: 503, headers: corsHeaders },
  );
}

if (dailyAllowed !== true) {
  return new Response(
    JSON.stringify({ error: "Daily analysis limit reached. Please try again later." }),
    { status: 429, headers: corsHeaders },
  );
}

    const wordCount = text.trim().split(/\s+/).filter(Boolean).length;
    const docTitle = (title || "Untitled Document").slice(0, 200);

    // Call Gemini API
    const geminiUrl =
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;

    const geminiPayload = {
      system_instruction: {
        parts: [{ text: SYSTEM_PROMPT }],
      },
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Document title: ${docTitle}\n\nAgreement text to analyze:\n\n${text}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    };

    const controller = new AbortController();

const timeoutId = setTimeout(() => {
  controller.abort();
}, 25000);

let geminiResponse: Response;

try {
  geminiResponse = await fetch(geminiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(geminiPayload),
    signal: controller.signal,
  });
} catch (error) {
  if (error instanceof Error && error.name === "AbortError") {
    return new Response(
      JSON.stringify({
        error: "AI analysis timed out. Please try again.",
      }),
      {
        status: 504,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      },
    );
  }

  throw error;
} finally {
  clearTimeout(timeoutId);
}

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error("Gemini API error:", geminiResponse.status, errorText);
      return new Response(
        JSON.stringify({
          error: `The AI analysis service returned an error (status ${geminiResponse.status}). Please try again.`,
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const geminiData = await geminiResponse.json();
    const candidates = geminiData?.candidates;
    if (!candidates || candidates.length === 0) {
      return new Response(
        JSON.stringify({
          error:
            "The AI analysis service did not return a result. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const responseText = candidates[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      return new Response(
        JSON.stringify({
          error:
            "The AI analysis service returned an empty result. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    let parsed: unknown;
    try {
      parsed = extractJsonFromResponse(responseText);
    } catch {
      return new Response(
        JSON.stringify({
          error:
            "The AI analysis service returned an unparseable result. Please try again.",
        }),
        {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    const aiResult = parsed as { summary?: string; findings?: unknown[] };
    const summary =
      typeof aiResult.summary === "string"
        ? aiResult.summary
        : "Analysis completed.";

    const rawFindings = Array.isArray(aiResult.findings) ? aiResult.findings : [];

    // Validate every finding — verify exact quote exists in source text
    const validatedFindings: AIFinding[] = [];
    for (const raw of rawFindings) {
      const validated = validateFinding(raw, text);
      if (validated) {
        validatedFindings.push(validated);
      }
    }

    const { score, grade } = calculateScore(validatedFindings, wordCount);

    const criticalCount = validatedFindings.filter(
      (f) => f.attention_level === "High",
    ).length;
    const warningCount = validatedFindings.filter(
      (f) => f.attention_level === "Medium",
    ).length;
    const infoCount = validatedFindings.filter(
      (f) => f.attention_level === "Low",
    ).length;

    // Map to the format the frontend expects (severity + new fields)
    const findingsForClient = validatedFindings.map((f) => ({
      category: f.category,
      severity: mapAttentionToSeverity(f.attention_level),
      title: f.clause_title,
      description: f.plain_english_explanation,
      excerpt: f.exact_evidence_quote,
      recommendation: f.recommendation,
      why_it_matters: f.why_it_matters,
      attention_level: f.attention_level,
      certainty: f.certainty,
      missing_information: f.missing_information,
    }));

    return new Response(
      JSON.stringify({
        summary,
        score,
        grade,
        wordCount,
        criticalCount,
        warningCount,
        infoCount,
        findings: findingsForClient,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred during analysis. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
