import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, notFound } from "@/lib/api";
import { deckCreateSchema } from "@/lib/validation/schemas";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const deck = await prisma.deck.findFirst({
      where: { id, userId },
      include: {
        cards: {
          orderBy: { createdAt: "desc" },
          include: {
            // latest practice only, for showing "My sentence" + score
            practices: { orderBy: { createdAt: "desc" }, take: 1 },
          },
        },
      },
    });
    if (!deck) return notFound("Không tìm thấy bộ từ");
    return ok(deck);
  });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const body = deckCreateSchema.partial().parse(await request.json());
    const existing = await prisma.deck.findFirst({ where: { id, userId } });
    if (!existing) return notFound("Không tìm thấy bộ từ");
    const deck = await prisma.deck.update({ where: { id }, data: body });
    return ok(deck);
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const existing = await prisma.deck.findFirst({ where: { id, userId } });
    if (!existing) return notFound("Không tìm thấy bộ từ");
    await prisma.deck.delete({ where: { id } });
    return ok({ deleted: true });
  });
}
