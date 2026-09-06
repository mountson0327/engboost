import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, badRequest } from "@/lib/api";
import { quizGenerateSchema } from "@/lib/validation/schemas";

type QuizItem = {
  cardId: string;
  term: string;
  prompt: string;
  choices: string[];
  correct: string;
};

// Deterministic-ish shuffle without Math.random dependency concerns.
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// POST /api/quiz  { deckId, count? } -> generate multiple-choice questions.
// Weak cards (more lapses, fewer reps) are prioritised.
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { deckId, count = 10 } = quizGenerateSchema.parse(
      await request.json(),
    );

    const deck = await prisma.deck.findFirst({
      where: { id: deckId, userId, deletedAt: null },
      include: { cards: { where: { deletedAt: null } } },
    });
    if (!deck) return badRequest("Bộ từ không tồn tại");

    const withMeaning = deck.cards.filter(
      (c) => (c.meaningVi && c.meaningVi.trim()) || (c.meaningEn && c.meaningEn.trim()),
    );
    if (withMeaning.length < 4) {
      return badRequest(
        "Cần ít nhất 4 thẻ có nghĩa trong bộ từ để tạo quiz trắc nghiệm.",
      );
    }

    // Prioritise weaker cards: more lapses first, then fewer reps.
    const ranked = [...withMeaning].sort(
      (a, b) => b.lapses - a.lapses || a.reps - b.reps,
    );
    const picked = ranked.slice(0, Math.min(count, ranked.length));
    const allTerms = withMeaning.map((c) => c.term);

    const items: QuizItem[] = picked.map((card) => {
      const distractors = shuffle(allTerms.filter((t) => t !== card.term)).slice(
        0,
        3,
      );
      const choices = shuffle([card.term, ...distractors]);
      const prompt = card.meaningVi?.trim() || card.meaningEn?.trim() || card.term;
      return { cardId: card.id, term: card.term, prompt, choices, correct: card.term };
    });

    return ok({ deckId, items });
  });
}
