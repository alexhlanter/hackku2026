import { GoogleGenAI } from "@google/genai";

// Optional Vision-Language Model check that runs after EXIF + GPS
// verification. It asks Gemma 4 (via the Google AI Studio API)
// whether the photo plausibly shows the goal scene — e.g. "is this
// really a gym?" — so a user can't just submit a random selfie at
// the right coordinates.
//
// This is *advisory*: never throws upward, never blocks goal
// resolution. The verdict is recorded on the proof doc as a `vlm`
// block and surfaced to the UI for an "AI confirmed" badge.

const DEFAULT_MODEL = process.env.GEMINI_VLM_MODEL || "gemma-4-26b-a4b-it";

let cachedClient = null;
function getClient() {
  if (cachedClient) return cachedClient;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  cachedClient = new GoogleGenAI({ apiKey });
  return cachedClient;
}

function buildPrompt(goal) {
  const title = (goal?.title || "their goal").trim();
  const locName = goal?.location?.name?.trim();
  const locClause = locName
    ? ` The check-in location is described as "${locName}".`
    : "";

  return [
    `A user committed to the goal: "${title}".${locClause}`,
    "",
    "Examine the attached photo and decide whether it is plausible visual evidence",
    "that the user is currently doing this activity or is at this kind of place.",
    "Be lenient — partial views, selfies, low light, or off-angle shots are fine",
    "as long as something in the frame supports the goal. Reject only if the",
    "scene clearly contradicts the goal (e.g. a goal of going to the gym but the",
    "photo is a bedroom or a meal).",
    "",
    'Respond with STRICT JSON only, no prose, in this exact shape:',
    '{"matches": boolean, "confidence": number between 0 and 1, "label": "short scene label", "rationale": "one sentence explanation"}',
  ].join("\n");
}

// Best-effort JSON extractor. Gemma sometimes wraps its JSON in
// markdown fences or adds leading prose despite instructions.
function parseJsonLoose(text) {
  if (!text) return null;
  const trimmed = String(text).trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    // fall through
  }

  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenced) {
    try {
      return JSON.parse(fenced[1].trim());
    } catch {
      // fall through
    }
  }

  const firstBrace = trimmed.indexOf("{");
  const lastBrace = trimmed.lastIndexOf("}");
  if (firstBrace !== -1 && lastBrace > firstBrace) {
    try {
      return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
    } catch {
      // fall through
    }
  }

  return null;
}

export async function verifyImageMatchesGoal({
  buffer,
  mimeType,
  goal,
  // Tight enough to give up well before Vercel's serverless function
  // budget runs out. The route bumps maxDuration to 30s; we leave a
  // ~20s margin so EXIF parse + DB write + XRPL submit can still
  // finish even when Gemma hangs near its limit.
  timeoutMs = 8_000,
}) {
  const client = getClient();
  if (!client) {
    return { checked: false, reason: "no_api_key" };
  }
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    return { checked: false, reason: "empty_buffer" };
  }

  const prompt = buildPrompt(goal);
  const contents = [
    {
      role: "user",
      parts: [
        {
          inlineData: {
            mimeType: mimeType || "image/jpeg",
            data: buffer.toString("base64"),
          },
        },
        { text: prompt },
      ],
    },
  ];

  // Race the model call against a timeout so a slow Gemini round-trip
  // never holds up the proof verification flow during a live demo.
  const controller = AbortSignal.timeout
    ? AbortSignal.timeout(timeoutMs)
    : null;

  try {
    const response = await client.models.generateContent({
      model: DEFAULT_MODEL,
      contents,
      config: controller ? { abortSignal: controller } : undefined,
    });

    const text =
      typeof response?.text === "string"
        ? response.text
        : response?.candidates?.[0]?.content?.parts
            ?.map((p) => p?.text || "")
            .join("") || "";

    const parsed = parseJsonLoose(text);
    if (!parsed || typeof parsed !== "object") {
      return {
        checked: true,
        model: DEFAULT_MODEL,
        matches: null,
        confidence: null,
        label: null,
        rationale: null,
        rawText: text?.slice(0, 500) || null,
        reason: "unparseable_response",
      };
    }

    const matches =
      typeof parsed.matches === "boolean" ? parsed.matches : null;
    const confidence =
      typeof parsed.confidence === "number"
        ? Math.max(0, Math.min(1, parsed.confidence))
        : null;

    return {
      checked: true,
      model: DEFAULT_MODEL,
      matches,
      confidence,
      label:
        typeof parsed.label === "string" ? parsed.label.slice(0, 80) : null,
      rationale:
        typeof parsed.rationale === "string"
          ? parsed.rationale.slice(0, 280)
          : null,
    };
  } catch (err) {
    console.warn(
      "[vlm] verifyImageMatchesGoal failed:",
      err?.message || err
    );
    return {
      checked: false,
      reason: "request_failed",
      error: String(err?.message || err).slice(0, 200),
    };
  }
}
