import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok } from "@/lib/api";

// GET /api/decks/trash -> the current user's soft-deleted decks
export async function GET() {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const decks = await prisma.deck.findMany({
      where: { userId, deletedAt: { not: null } },
      orderBy: { deletedAt: "desc" },
      include: { _count: { select: { cards: true } } },
    });
    return ok(decks);
  });
}
