import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok } from "@/lib/api";
import { deckCreateSchema } from "@/lib/validation/schemas";

export async function GET() {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const decks = await prisma.deck.findMany({
      where: { userId, deletedAt: null },
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { cards: { where: { deletedAt: null } } } } },
    });
    return ok(decks);
  });
}

export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const body = deckCreateSchema.parse(await request.json());
    const deck = await prisma.deck.create({
      data: {
        userId,
        name: body.name,
        description: body.description ?? null,
      },
    });
    return ok(deck, { status: 201 });
  });
}
