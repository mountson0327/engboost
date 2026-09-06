import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, notFound } from "@/lib/api";

// POST /api/decks/[id]/restore -> un-delete a soft-deleted deck (owner)
export async function POST(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const existing = await prisma.deck.findFirst({
      where: { id, userId, deletedAt: { not: null } },
    });
    if (!existing) return notFound("Không tìm thấy bộ từ trong thùng rác");
    await prisma.deck.update({ where: { id }, data: { deletedAt: null } });
    return ok({ restored: true });
  });
}
