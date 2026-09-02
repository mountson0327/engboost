import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok } from "@/lib/api";
import { deckImportSchema } from "@/lib/validation/schemas";

// POST /api/decks/import  { name, description?, cards[] } -> create a deck + cards
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const body = deckImportSchema.parse(await request.json());

    const deck = await prisma.deck.create({
      data: {
        userId,
        name: body.name,
        description: body.description ?? null,
        cards: {
          create: body.cards.map((c) => ({
            term: c.term,
            ipa: c.ipa || null,
            pos: c.pos || null,
            meaningEn: c.meaningEn || null,
            meaningVi: c.meaningVi || null,
            examples: c.examples ?? [],
          })),
        },
      },
      include: { _count: { select: { cards: true } } },
    });

    return ok({ deckId: deck.id, imported: deck._count.cards }, { status: 201 });
  });
}
