import { prisma } from "@/lib/db";
import { handle, ok } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";

// GET /api/admin/stats -> system-wide counts (admin only)
export async function GET() {
  return handle(async () => {
    await requireAdmin();
    const [users, admins, decks, cards] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: "admin" } }),
      prisma.deck.count({ where: { deletedAt: null } }),
      prisma.card.count({ where: { deletedAt: null } }),
    ]);
    return ok({ users, admins, decks, cards });
  });
}
