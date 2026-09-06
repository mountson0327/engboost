import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ").max(200),
  password: z.string().min(6, "Mật khẩu tối thiểu 6 ký tự").max(200),
  name: z.string().max(100).optional(),
});

export const loginSchema = z.object({
  email: z.string().email().max(200),
  password: z.string().min(1).max(200),
});

export const deckCreateSchema = z.object({
  name: z.string().min(1, "Tên bộ từ không được trống").max(100),
  description: z.string().max(500).optional().nullable(),
});

export const cardCreateSchema = z.object({
  deckId: z.string().min(1),
  term: z.string().min(1, "Từ không được trống").max(200),
  ipa: z.string().max(200).optional().nullable(),
  pos: z.string().max(50).optional().nullable(),
  meaningEn: z.string().max(1000).optional().nullable(),
  meaningVi: z.string().max(1000).optional().nullable(),
  examples: z.array(z.string().max(500)).max(10).optional(),
});

export const cardUpdateSchema = cardCreateSchema.partial().omit({ deckId: true });

export const gradeSchema = z.object({
  cardId: z.string().min(1),
  grade: z.enum(["again", "hard", "good", "easy"]),
});

export const generateCardSchema = z.object({
  term: z.string().min(1).max(200),
});

export const grammarSchema = z.object({
  text: z.string().min(1).max(2000),
});

export const chatSchema = z.object({
  topic: z.string().min(1).max(200),
  sessionId: z.string().min(1),
  message: z.string().min(1).max(2000),
});

export const quizGenerateSchema = z.object({
  deckId: z.string().min(1),
  count: z.number().int().min(1).max(50).optional(),
});

export const quizSubmitSchema = z.object({
  deckId: z.string().optional().nullable(),
  items: z
    .array(
      z.object({
        cardId: z.string(),
        term: z.string(),
        prompt: z.string(),
        choices: z.array(z.string()),
        correct: z.string(),
        chosen: z.string(),
      }),
    )
    .min(1),
});

export const readingGenerateSchema = z.object({
  topic: z.string().min(1).max(200),
  level: z.string().min(1).max(10).optional(),
});

export const lookupSchema = z.object({
  word: z.string().min(1).max(100),
});

export const aiSettingsSchema = z.object({
  provider: z.enum(["anthropic", "openai", "gemini"]).optional(),
  model: z.string().max(100).optional(),
  apiKey: z.string().max(1000).optional(),
});

export const practiceSchema = z.object({
  cardId: z.string().min(1),
  sentence: z.string().min(1).max(1000),
});

export const writingSchema = z.object({
  topic: z.string().min(1).max(200),
  text: z.string().min(1).max(5000),
});

// Import / export
export const importCardSchema = z.object({
  term: z.string().min(1).max(200),
  ipa: z.string().max(200).optional(),
  pos: z.string().max(50).optional(),
  meaningEn: z.string().max(1000).optional(),
  meaningVi: z.string().max(1000).optional(),
  examples: z.array(z.string().max(500)).max(20).optional(),
});

export const bulkImportSchema = z.object({
  cards: z.array(importCardSchema).min(1).max(1000),
});

export const deckImportSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional().nullable(),
  cards: z.array(importCardSchema).max(1000),
});

export type DeckCreate = z.infer<typeof deckCreateSchema>;
export type CardCreate = z.infer<typeof cardCreateSchema>;
