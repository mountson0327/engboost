import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, badRequest } from "@/lib/api";
import { cardCreateSchema } from "@/lib/validation/schemas";

export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const body = cardCreateSchema.parse(await request.json());

    // Make sure the deck belongs to this user before adding to it.
    const deck = await prisma.deck.findFirst({
      where: { id: body.deckId, userId, deletedAt: null },
    });
    if (!deck) return badRequest("Bộ từ không tồn tại");

    const card = await prisma.card.create({
      data: {
        deckId: body.deckId,
        term: body.term,
        ipa: body.ipa ?? null,
        pos: body.pos ?? null,
        meaningEn: body.meaningEn ?? null,
        meaningVi: body.meaningVi ?? null,
        examples: body.examples ?? [],
      },
    });
    return ok(card, { status: 201 });
  });
}
