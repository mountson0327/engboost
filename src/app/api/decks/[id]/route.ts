import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { getEffectiveRole } from "@/lib/auth";
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
      where: { id, userId, deletedAt: null },
      include: {
        cards: {
          where: { deletedAt: null },
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
    const existing = await prisma.deck.findFirst({
      where: { id, userId, deletedAt: null },
    });
    if (!existing) return notFound("Không tìm thấy bộ từ");
    const deck = await prisma.deck.update({ where: { id }, data: body });
    return ok(deck);
  });
}

// Regular users soft-delete (recoverable); admins hard-delete.
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const existing = await prisma.deck.findFirst({ where: { id, userId } });
    if (!existing) return notFound("Không tìm thấy bộ từ");

    const role = await getEffectiveRole();
    if (role === "admin") {
      await prisma.deck.delete({ where: { id } });
      return ok({ deleted: true, hard: true });
    }
    await prisma.deck.update({ where: { id }, data: { deletedAt: new Date() } });
    return ok({ deleted: true, soft: true });
  });
}
