// Plain shapes for client components (mirror the Prisma models, serialised).
export type SentencePractice = {
  id: string;
  cardId: string;
  sentence: string;
  corrected: string | null;
  explanation: string | null;
  usage: string | null;
  natural: string | null;
  score: number | null;
  cefr: string | null;
  createdAt: string;
  source?: "claude" | "fallback";
};

export type Card = {
  id: string;
  deckId: string;
  term: string;
  ipa: string | null;
  pos: string | null;
  meaningEn: string | null;
  meaningVi: string | null;
  examples: string[];
  ease: number;
  intervalDays: number;
  reps: number;
  lapses: number;
  dueDate: string;
  state: "new" | "learning" | "review" | "mastered";
  deck?: { id: string; name: string };
  practices?: SentencePractice[];
};

export type Deck = {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  _count?: { cards: number };
  cards?: Card[];
};

export type GeneratedCard = {
  term: string;
  ipa: string;
  pos: string;
  meaningEn: string;
  meaningVi: string;
  examples: string[];
  source: "claude" | "fallback";
};
