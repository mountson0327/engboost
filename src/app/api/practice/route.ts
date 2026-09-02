import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, notFound } from "@/lib/api";
import { practiceSchema } from "@/lib/validation/schemas";
import { reviewSentence } from "@/lib/ai/claude";

// POST /api/practice  { cardId, sentence }
// AI-reviews a learner sentence that uses the card's term, then saves it.
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { cardId, sentence } = practiceSchema.parse(await request.json());

    const card = await prisma.card.findFirst({
      where: { id: cardId, deck: { userId } },
    });
    if (!card) return notFound("Không tìm thấy thẻ");

    const review = await reviewSentence(card.term, sentence);

    const saved = await prisma.sentencePractice.create({
      data: {
        cardId,
        userId,
        sentence,
        corrected: review.corrected,
        explanation: review.explanation,
        usage: review.usage,
        natural: review.natural,
        score: review.score,
        cefr: review.cefr,
      },
    });

    return ok({ ...saved, source: review.source });
  });
}

// GET /api/practice?cardId= -> history for a card
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const cardId = new URL(request.url).searchParams.get("cardId");
    if (!cardId) return ok([]);
    const rows = await prisma.sentencePractice.findMany({
      where: { cardId, userId },
      orderBy: { createdAt: "desc" },
      take: 20,
    });
    return ok(rows);
  });
}
