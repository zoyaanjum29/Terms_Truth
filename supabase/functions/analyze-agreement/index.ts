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

const SYSTEM_PROMPT = `You are TermsTruth, an expert legal analyst that examines terms of service, privacy policies, and other legal agreements. Your job is to identify clauses that matter to ordinary users and explain them in plain English.

CRITICAL RULES:
1. Every finding MUST include an exact_evidence_quote that is copied verbatim from the agreement text. Do not paraphrase. Do not summarize. Copy the exact words from the document.
2. If you cannot find an exact quote from the document to support a finding, do NOT include that finding.
3. Never invent clauses or assume a clause exists if it is not in the text.
4. Clearly distinguish between:
   - "Explicit": the agreement directly states this provision
   - "Uncertain": the wording is ambiguous or you are inferring this from indirect language
5. Do not interpret missing information as proof of wrongdoing. If something is not specified, use the missing_information field to note what is absent, and set certainty to "Uncertain".
6. Do not produce a fairness score. You only identify and explain clauses.

Examine the agreement for these areas (but do NOT restrict yourself to only these — identify any other unusual or important clauses you discover):
- Personal data collection and sharing
- Data selling and third-party sharing
- Data retention and deletion
- AI training and use of uploaded content
- Automatic renewals and subscriptions
- Cancellation and refunds
- Arbitration and dispute resolution
- Liability limitations
- Content ownership and usage licences
- Unilateral policy changes
- Account suspension and termination
- Any other unusual, surprising, or user-impactful clauses

For each finding, provide:
- category: a short label for the type of clause (e.g. "Data Privacy", "Arbitration", "AI Training")
- clause_title: a short descriptive title for this specific finding
- exact_evidence_quote: the EXACT text copied from the agreement. Must be verbatim.
- plain_english_explanation: explain what this clause means in simple, everyday language
- why_it_matters: explain the practical impact on the user
- attention_level: "High" if this significantly limits user rights or creates real risk, "Medium" if it warrants caution, "Low" if it is informational
- certainty: "Explicit" if the agreement directly states this, "Uncertain" if the wording is ambiguous
- recommendation: what the user should do or consider
- missing_information: if there is something notable that the agreement does NOT specify (e.g. "No data retention period is specified"), state it here. Otherwise null.

Also provide a summary: a 2-3 sentence plain-English overview of the agreement's overall character.

Return ONLY valid JSON in this exact format:
{
  "summary": "string",
  "findings": [
    {
      "category": "string",
      "clause_title": "string",
      "exact_evidence_quote": "string",
      "plain_english_explanation": "string",
      "why_it_matters": "string",
      "attention_level": "High" | "Medium" | "Low",
      "certainty": "Explicit" | "Uncertain",
      "recommendation": "string",
      "missing_information": "string or null"
    }
  ]
}

If the input text is too short, empty, or not a real agreement, return:
{"summary": "The provided text does not appear to be a meaningful legal agreement.", "findings": []}`;

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

    const geminiResponse = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(geminiPayload),
    });

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
