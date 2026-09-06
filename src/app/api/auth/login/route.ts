import { prisma } from "@/lib/db";
import { handle, ok, badRequest } from "@/lib/api";
import { loginSchema } from "@/lib/validation/schemas";
import { verifyPassword, setSessionCookie } from "@/lib/auth";

// POST /api/auth/login { email, password }
export async function POST(request: Request) {
  return handle(async () => {
    const body = loginSchema.parse(await request.json());
    const email = body.email.trim().toLowerCase();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !user.passwordHash) {
      return badRequest("Email hoặc mật khẩu không đúng");
    }
    const okPw = await verifyPassword(body.password, user.passwordHash);
    if (!okPw) return badRequest("Email hoặc mật khẩu không đúng");

    await setSessionCookie({ userId: user.id, role: user.role });
    return ok({ id: user.id, email: user.email, name: user.name, role: user.role });
  });
}
