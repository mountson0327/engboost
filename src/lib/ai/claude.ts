import Anthropic from "@anthropic-ai/sdk";
import { getAiConfig, hasActiveAiKey, type AiConfig } from "./config";

export type AiSource = "ai" | "fallback";
export { hasActiveAiKey };

export type ChatMsg = { role: "user" | "assistant"; content: string };

// ---- Provider-agnostic completion -----------------------------------------

/** Send a chat completion to the active provider and return plain text. */
async function complete(
  cfg: AiConfig,
  system: string,
  messages: ChatMsg[],
  maxTokens = 1024,
): Promise<string> {
  if (cfg.provider === "anthropic") {
    const client = new Anthropic({ apiKey: cfg.apiKey });
    const msg = await client.messages.create({
      model: cfg.model,
      max_tokens: maxTokens,
      system,
      messages,
    });
    return msg.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("\n")
      .trim();
  }

  if (cfg.provider === "openai") {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${cfg.apiKey}`,
      },
      body: JSON.stringify({
        model: cfg.model,
        max_tokens: maxTokens,
        messages: [
          ...(system ? [{ role: "system", content: system }] : []),
          ...messages,
        ],
      }),
    });
    if (!res.ok) throw new Error(`OpenAI ${res.status}: ${await res.text()}`);
    const data = await res.json();
    return String(data?.choices?.[0]?.message?.content ?? "").trim();
  }

  // gemini
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    cfg.model,
  )}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
      ...(system
        ? { systemInstruction: { parts: [{ text: system }] } }
        : {}),
      generationConfig: { maxOutputTokens: maxTokens },
    }),
  });
  if (!res.ok) throw new Error(`Gemini ${res.status}: ${await res.text()}`);
  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p: { text?: string }) => p.text ?? "")
    .join("")
    .trim();
}

async function completeText(
  cfg: AiConfig,
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<string> {
  return complete(cfg, system, [{ role: "user", content: user }], maxTokens);
}

/** Ask the model for JSON and parse it defensively (handles ```json fences). */
async function completeJson<T>(
  cfg: AiConfig,
  system: string,
  user: string,
  maxTokens = 1024,
): Promise<T> {
  const raw = await completeText(
    cfg,
    system + "\nRespond with ONLY valid JSON, no prose, no code fences.",
    user,
    maxTokens,
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
  source: AiSource;
};

export async function generateCard(term: string): Promise<GeneratedCard> {
  const clean = term.trim();
  const cfg = await getAiConfig();
  if (!cfg.hasKey) return fallbackCard(clean);

  try {
    const data = await completeJson<Omit<GeneratedCard, "term" | "source">>(
      cfg,
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
      source: "ai",
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
  source: AiSource;
};

export async function correctGrammar(text: string): Promise<GrammarResult> {
  const clean = text.trim();
  const cfg = await getAiConfig();
  if (!cfg.hasKey) {
    return {
      corrected: clean,
      explanation:
        "AI grammar feedback is unavailable. Add an API key in Settings to enable it.",
      source: "fallback",
    };
  }
  try {
    const data = await completeJson<{ corrected: string; explanation: string }>(
      cfg,
      "You are an English writing coach for a Vietnamese learner. Correct the grammar and " +
        "naturalness of the user's sentence, then briefly explain the main fixes (in Vietnamese).",
      `Sentence: "${clean}". Return JSON with keys: corrected (the improved sentence), explanation (a short Vietnamese explanation of the fixes).`,
    );
    return { ...data, source: "ai" };
  } catch {
    return {
      corrected: clean,
      explanation: "Could not reach the AI service. Please try again.",
      source: "fallback",
    };
  }
}

// ---- Conversation practice ------------------------------------------------

export type ChatTurn = ChatMsg;

export async function chatReply(
  topic: string,
  history: ChatTurn[],
): Promise<{ reply: string; source: AiSource }> {
  const cfg = await getAiConfig();
  if (!cfg.hasKey) {
    const last = history.filter((h) => h.role === "user").at(-1)?.content ?? "";
    return {
      reply:
        `(Practice mode — no AI key) You said: "${last}". ` +
        `Try adding more detail about "${topic}". Set an API key in Settings to turn on the real AI tutor.`,
      source: "fallback",
    };
  }
  try {
    const reply = await complete(
      cfg,
      `You are a friendly English conversation partner helping a Vietnamese learner practice. ` +
        `Topic: "${topic}". Keep replies short (2-4 sentences), ask a follow-up question, ` +
        `and gently correct any serious mistakes inline.`,
      history,
      600,
    );
    return { reply, source: "ai" };
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
  explanation: string;
  usage: string;
  natural: string;
  score: number;
  cefr: string;
  source: AiSource;
};

export async function reviewSentence(
  term: string,
  sentence: string,
): Promise<SentenceReview> {
  const clean = sentence.trim();
  const cfg = await getAiConfig();
  if (!cfg.hasKey) {
    return {
      corrected: clean,
      explanation:
        "AI review chỉ hoạt động khi có khoá API. Thêm khoá trong Cài đặt để bật chấm câu.",
      usage: "",
      natural: clean,
      score: 0,
      cefr: "",
      source: "fallback",
    };
  }
  try {
    const data = await completeJson<Omit<SentenceReview, "source">>(
      cfg,
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
      source: "ai",
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

// ---- Paragraph writing review ---------------------------------------------

export type ParagraphReview = {
  corrected: string;
  feedback: string; // overall feedback (Vietnamese)
  improvements: string; // vocab/coherence suggestions (Vietnamese)
  score: number; // 0-10
  cefr: string; // A1-C1
  source: AiSource;
};

export async function reviewParagraph(
  topic: string,
  text: string,
): Promise<ParagraphReview> {
  const clean = text.trim();
  const cfg = await getAiConfig();
  if (!cfg.hasKey) {
    return {
      corrected: clean,
      feedback:
        "AI chấm bài chỉ hoạt động khi có khoá API. Thêm khoá trong Cài đặt để bật.",
      improvements: "",
      score: 0,
      cefr: "",
      source: "fallback",
    };
  }
  try {
    const data = await completeJson<Omit<ParagraphReview, "source">>(
      cfg,
      "You are an English writing examiner and tutor for a Vietnamese learner. " +
        "The learner wrote a paragraph on a topic. Review grammar, vocabulary, coherence and task relevance.",
      `Topic: "${topic}".\nLearner's paragraph:\n"""${clean}"""\n` +
        `Return JSON with keys: ` +
        `corrected (the paragraph rewritten with corrected grammar and improved naturalness, keeping the learner's ideas), ` +
        `feedback (overall feedback in Vietnamese: strengths + main issues), ` +
        `improvements (Vietnamese, concrete suggestions on vocabulary, linking words and coherence), ` +
        `score (an integer 0-10 for the original paragraph), ` +
        `cefr (estimated CEFR level of the original, one of A1,A2,B1,B2,C1,C2).`,
      2048,
    );
    return {
      corrected: data.corrected ?? clean,
      feedback: data.feedback ?? "",
      improvements: data.improvements ?? "",
      score:
        typeof data.score === "number"
          ? Math.max(0, Math.min(10, Math.round(data.score)))
          : 0,
      cefr: data.cefr ?? "",
      source: "ai",
    };
  } catch {
    return {
      corrected: clean,
      feedback: "Không kết nối được AI. Vui lòng thử lại.",
      improvements: "",
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
  source: AiSource;
};

export async function generateReading(
  topic: string,
  level: string,
): Promise<GeneratedReading> {
  const cfg = await getAiConfig();
  if (!cfg.hasKey) {
    return {
      title: `About ${topic}`,
      body:
        `This is a sample reading passage about ${topic}. ` +
        `Add an API key in Settings to generate real level-appropriate passages. ` +
        `Meanwhile you can paste your own text and still click any word to look it up and save it.`,
      source: "fallback",
    };
  }
  try {
    const data = await completeJson<{ title: string; body: string }>(
      cfg,
      `You write short English reading passages for language learners at CEFR level ${level}.`,
      `Write a passage (about 120-160 words) on the topic "${topic}" at level ${level}. ` +
        `Return JSON with keys: title, body.`,
    );
    return { ...data, source: "ai" };
  } catch {
    return {
      title: `About ${topic}`,
      body: "Could not generate a passage right now. Please try again.",
      source: "fallback",
    };
  }
}
