import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok } from "@/lib/api";
import { quizSubmitSchema } from "@/lib/validation/schemas";

// POST /api/quiz/submit { deckId?, items[] } -> grade + persist the attempt
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { deckId, items } = quizSubmitSchema.parse(await request.json());

    const graded = items.map((it) => ({
      ...it,
      isCorrect: it.chosen === it.correct,
    }));
    const score = graded.filter((g) => g.isCorrect).length;

    const attempt = await prisma.quizAttempt.create({
      data: {
        userId,
        deckId: deckId ?? null,
        score,
        total: graded.length,
        items: graded,
      },
    });

    return ok({
      id: attempt.id,
      score,
      total: graded.length,
      items: graded,
      wrong: graded.filter((g) => !g.isCorrect),
    });
  });
}
