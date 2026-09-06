import { prisma } from "@/lib/db";
import { handle, ok, badRequest } from "@/lib/api";
import { registerSchema } from "@/lib/validation/schemas";
import { hashPassword, setSessionCookie } from "@/lib/auth";

// POST /api/auth/register { email, password, name? }
// The FIRST registered account becomes admin and claims any pre-existing
// (password-less) data owner so no existing decks are lost.
export async function POST(request: Request) {
  return handle(async () => {
    const body = registerSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing && existing.passwordHash) {
      return badRequest("Email đã được đăng ký");
    }

    const passwordHash = await hashPassword(body.password);
    const isFirst =
      (await prisma.user.count({ where: { passwordHash: { not: null } } })) === 0;

    let user;
    if (isFirst) {
      // Claim an existing password-less user (seed/demo owner) to keep its data.
      const claim =
        existing ??
        (await prisma.user.findFirst({
          where: { passwordHash: null },
          orderBy: { createdAt: "asc" },
        }));
      if (claim) {
        user = await prisma.user.update({
          where: { id: claim.id },
          data: {
            email,
            name: body.name ?? claim.name ?? "Admin",
            passwordHash,
            role: "admin",
          },
        });
      } else {
        user = await prisma.user.create({
          data: { email, name: body.name ?? "Admin", passwordHash, role: "admin" },
        });
      }
    } else {
      user = await prisma.user.create({
        data: { email, name: body.name ?? null, passwordHash, role: "user" },
      });
    }

    await setSessionCookie({ userId: user.id, role: user.role });
    return ok(
      { id: user.id, email: user.email, name: user.name, role: user.role },
      { status: 201 },
    );
  });
}
