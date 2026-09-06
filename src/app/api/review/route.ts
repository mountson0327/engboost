import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, notFound } from "@/lib/api";
import { gradeSchema } from "@/lib/validation/schemas";
import { schedule } from "@/lib/srs";

// GET /api/review?deckId=&limit=  -> cards that are due now
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const url = new URL(request.url);
    const deckId = url.searchParams.get("deckId") ?? undefined;
    const limit = Number(url.searchParams.get("limit") ?? "20");

    const cards = await prisma.card.findMany({
      where: {
        dueDate: { lte: new Date() },
        deletedAt: null,
        deck: { userId, deletedAt: null, ...(deckId ? { id: deckId } : {}) },
      },
      orderBy: { dueDate: "asc" },
      take: Math.min(Math.max(limit, 1), 100),
      include: { deck: { select: { id: true, name: true } } },
    });
    return ok(cards);
  });
}

// POST /api/review  { cardId, grade } -> apply SM-2 and reschedule
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { cardId, grade } = gradeSchema.parse(await request.json());

    const card = await prisma.card.findFirst({
      where: { id: cardId, deck: { userId } },
    });
    if (!card) return notFound("Không tìm thấy thẻ");

    const next = schedule(
      {
        ease: card.ease,
        intervalDays: card.intervalDays,
        reps: card.reps,
        lapses: card.lapses,
      },
      grade,
    );

    const updated = await prisma.card.update({
      where: { id: cardId },
      data: {
        ease: next.ease,
        intervalDays: next.intervalDays,
        reps: next.reps,
        lapses: next.lapses,
        dueDate: next.dueDate,
        state: next.state,
      },
    });
    return ok(updated);
  });
}
