import Anthropic from "@anthropic-ai/sdk";

// Default model — override with ANTHROPIC_MODEL in .env.
const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

export function hasClaude(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic {
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

// ---- Shared helpers -------------------------------------------------------

async function completeText(
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<string> {
  const msg = await getClient().messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages: [{ role: "user", content: user }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();
}

/** Ask Claude for JSON and parse it defensively (handles ```json fences). */
async function completeJson<T>(system: string, user: string): Promise<T> {
  const raw = await completeText(
    system + "\nRespond with ONLY valid JSON, no prose, no code fences.",
    user,
  );
  const cleaned = raw
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned) as T;
}

// ---- Card generation ------------------------------------------------------

export type GeneratedCard = {
  term: string;
  ipa: string;
  pos: string;
  meaningEn: string;
  meaningVi: string;
  examples: string[];
  source: "claude" | "fallback";
};

export async function generateCard(term: string): Promise<GeneratedCard> {
  const clean = term.trim();
  if (!hasClaude()) return fallbackCard(clean);

  try {
    const data = await completeJson<Omit<GeneratedCard, "term" | "source">>(
      "You are an English vocabulary tutor for a Vietnamese learner. " +
        "Given an English word or phrase, return its IPA pronunciation, part of speech, " +
        "a concise English definition, a Vietnamese translation, and 2 natural example sentences.",
      `Word: "${clean}". Return JSON with keys: ipa, pos, meaningEn, meaningVi, examples (array of 2 strings).`,
    );
    return {
      term: clean,
      ipa: data.ipa ?? "",
      pos: data.pos ?? "",
      meaningEn: data.meaningEn ?? "",
      meaningVi: data.meaningVi ?? "",
      examples: Array.isArray(data.examples) ? data.examples.slice(0, 3) : [],
      source: "claude",
    };
  } catch {
    return fallbackCard(clean);
  }
}

function fallbackCard(term: string): GeneratedCard {
  return {
    term,
    ipa: "",
    pos: "",
    meaningEn: `(add a definition for "${term}")`,
    meaningVi: `(thêm nghĩa tiếng Việt cho "${term}")`,
    examples: [`This is an example sentence using "${term}".`],
    source: "fallback",
  };
}

// ---- Grammar correction ---------------------------------------------------

export type GrammarResult = {
  corrected: string;
  explanation: string;
  source: "claude" | "fallback";
};

export async function correctGrammar(text: string): Promise<GrammarResult> {
  const clean = text.trim();
  if (!hasClaude()) {
    return {
      corrected: clean,
      explanation:
        "AI grammar feedback is unavailable without an ANTHROPIC_API_KEY. Add one to .env to enable it.",
      source: "fallback",
    };
  }
  try {
    const data = await completeJson<{ corrected: string; explanation: string }>(
      "You are an English writing coach for a Vietnamese learner. Correct the grammar and " +
        "naturalness of the user's sentence, then briefly explain the main fixes (in Vietnamese).",
      `Sentence: "${clean}". Return JSON with keys: corrected (the improved sentence), explanation (a short Vietnamese explanation of the fixes).`,
    );
    return { ...data, source: "claude" };
  } catch {
    return {
      corrected: clean,
      explanation: "Could not reach the AI service. Please try again.",
      source: "fallback",
    };
  }
}

// ---- Conversation practice ------------------------------------------------

export type ChatTurn = { role: "user" | "assistant"; content: string };

export async function chatReply(
  topic: string,
  history: ChatTurn[],
): Promise<{ reply: string; source: "claude" | "fallback" }> {
  if (!hasClaude()) {
    const last = history.filter((h) => h.role === "user").at(-1)?.content ?? "";
    return {
      reply:
        `(Practice mode — no AI key) You said: "${last}". ` +
        `Try adding more detail about "${topic}". A real Claude tutor turns on once you set ANTHROPIC_API_KEY.`,
      source: "fallback",
    };
  }
  try {
    const msg = await getClient().messages.create({
      model: MODEL,
      max_tokens: 600,
      system:
        `You are a friendly English conversation partner helping a Vietnamese learner practice. ` +
        `Topic: "${topic}". Keep replies short (2-4 sentences), ask a follow-up question, ` +
        `and gently correct any serious mistakes inline.`,
      messages: history.map((h) => ({ role: h.role, content: h.content })),
    });
    const reply = msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
    return { reply, source: "claude" };
  } catch {
    return {
      reply: "Sorry, I couldn't reach the AI service. Please try again.",
      source: "fallback",
    };
  }
}

// ---- Sentence practice review ---------------------------------------------

export type SentenceReview = {
  corrected: string;
  explanation: string; // Vietnamese explanation of the fixes
  usage: string; // feedback on how the target word was used (Vietnamese)
  natural: string; // a more natural rewrite
  score: number; // 0-10
  cefr: string; // A1-C1
  source: "claude" | "fallback";
};

export async function reviewSentence(
  term: string,
  sentence: string,
): Promise<SentenceReview> {
  const clean = sentence.trim();
  if (!hasClaude()) {
    return {
      corrected: clean,
      explanation:
        "AI review chỉ hoạt động khi có ANTHROPIC_API_KEY. Thêm key vào .env để bật chấm câu.",
      usage: "",
      natural: clean,
      score: 0,
      cefr: "",
      source: "fallback",
    };
  }
  try {
    const data = await completeJson<Omit<SentenceReview, "source">>(
      "You are an English writing tutor for a Vietnamese learner. The learner is practising a " +
        "specific vocabulary item and wrote a sentence with it. Review the sentence.",
      `Target word/phrase: "${term}".\nLearner's sentence: "${clean}".\n` +
        `Return JSON with keys: ` +
        `corrected (the sentence fixed for grammar and naturalness), ` +
        `explanation (a short Vietnamese explanation of the grammar/word fixes), ` +
        `usage (a short Vietnamese note on whether "${term}" was used correctly in context/collocation, and how to use it well), ` +
        `natural (a more natural native-like rewrite), ` +
        `score (an integer 0-10 for the original sentence), ` +
        `cefr (estimated CEFR level of the original sentence, one of A1,A2,B1,B2,C1,C2).`,
    );
    return {
      corrected: data.corrected ?? clean,
      explanation: data.explanation ?? "",
      usage: data.usage ?? "",
      natural: data.natural ?? "",
      score:
        typeof data.score === "number"
          ? Math.max(0, Math.min(10, Math.round(data.score)))
          : 0,
      cefr: data.cefr ?? "",
      source: "claude",
    };
  } catch {
    return {
      corrected: clean,
      explanation: "Không kết nối được AI. Vui lòng thử lại.",
      usage: "",
      natural: clean,
      score: 0,
      cefr: "",
      source: "fallback",
    };
  }
}

// ---- Reading generation ---------------------------------------------------

export type GeneratedReading = {
  title: string;
  body: string;
  source: "claude" | "fallback";
};

export async function generateReading(
  topic: string,
  level: string,
): Promise<GeneratedReading> {
  if (!hasClaude()) {
    return {
      title: `About ${topic}`,
      body:
        `This is a sample reading passage about ${topic}. ` +
        `Add an ANTHROPIC_API_KEY to .env to generate real level-appropriate passages. ` +
        `Meanwhile you can paste your own text and still click any word to look it up and save it.`,
      source: "fallback",
    };
  }
  try {
    const data = await completeJson<{ title: string; body: string }>(
      `You write short English reading passages for language learners at CEFR level ${level}.`,
      `Write a passage (about 120-160 words) on the topic "${topic}" at level ${level}. ` +
        `Return JSON with keys: title, body.`,
    );
    return { ...data, source: "claude" };
  } catch {
    return {
      title: `About ${topic}`,
      body: "Could not generate a passage right now. Please try again.",
      source: "fallback",
    };
  }
}
