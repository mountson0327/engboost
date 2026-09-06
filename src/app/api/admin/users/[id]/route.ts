import { prisma } from "@/lib/db";
import { handle, ok, badRequest, notFound } from "@/lib/api";
import { requireAdmin } from "@/lib/auth";
import { z } from "zod";

const roleSchema = z.object({ role: z.enum(["admin", "user"]) });

// PATCH /api/admin/users/[id] { role } — change a user's role (admin only)
export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const adminId = await requireAdmin();
    const { id } = await ctx.params;
    const { role } = roleSchema.parse(await request.json());

    if (id === adminId && role !== "admin") {
      return badRequest("Không thể tự hạ quyền chính mình");
    }
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return notFound("Không tìm thấy người dùng");

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: { id: true, email: true, role: true },
    });
    return ok(user);
  });
}

// DELETE /api/admin/users/[id] — remove a user and all their data (admin only)
export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const adminId = await requireAdmin();
    const { id } = await ctx.params;
    if (id === adminId) return badRequest("Không thể xoá chính mình");
    const target = await prisma.user.findUnique({ where: { id } });
    if (!target) return notFound("Không tìm thấy người dùng");
    await prisma.user.delete({ where: { id } });
    return ok({ deleted: true });
  });
}
