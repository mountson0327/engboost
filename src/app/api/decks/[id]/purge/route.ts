import { prisma } from "@/lib/db";
import { getEffectiveRole } from "@/lib/auth";
import { handle, ok, notFound, badRequest } from "@/lib/api";

// DELETE /api/decks/[id]/purge -> permanently delete a soft-deleted deck.
// Admin-only (regular users cannot hard-delete). Uses the effective role, so an
// admin acting as a user cannot purge.
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const role = await getEffectiveRole();
    if (role !== "admin") return badRequest("Chỉ admin mới được xoá vĩnh viễn");
    const { id } = await ctx.params;
    const existing = await prisma.deck.findFirst({
      where: { id, deletedAt: { not: null } },
    });
    if (!existing) return notFound("Không tìm thấy bộ từ trong thùng rác");
    await prisma.deck.delete({ where: { id } });
    return ok({ purged: true });
  });
}
