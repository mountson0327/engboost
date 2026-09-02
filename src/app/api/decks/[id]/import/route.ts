import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, notFound } from "@/lib/api";
import { bulkImportSchema } from "@/lib/validation/schemas";

// POST /api/decks/[id]/import  { cards: [...] } -> bulk add cards to a deck
export async function POST(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;

    const deck = await prisma.deck.findFirst({ where: { id, userId } });
    if (!deck) return notFound("Không tìm thấy bộ từ");

    const { cards } = bulkImportSchema.parse(await request.json());

    const result = await prisma.card.createMany({
      data: cards.map((c) => ({
        deckId: id,
        term: c.term,
        ipa: c.ipa || null,
        pos: c.pos || null,
        meaningEn: c.meaningEn || null,
        meaningVi: c.meaningVi || null,
        examples: c.examples ?? [],
      })),
    });

    return ok({ imported: result.count });
  });
}
