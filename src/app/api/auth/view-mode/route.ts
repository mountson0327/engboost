import { cookies } from "next/headers";
import { handle, ok } from "@/lib/api";
import { requireAdmin, VIEW_COOKIE } from "@/lib/auth";
import { z } from "zod";

const schema = z.object({ mode: z.enum(["admin", "user"]) });

// POST /api/auth/view-mode { mode } — admin only. Toggles "act as user".
export async function POST(request: Request) {
  return handle(async () => {
    await requireAdmin();
    const { mode } = schema.parse(await request.json());
    const store = await cookies();
    if (mode === "user") {
      store.set(VIEW_COOKIE, "user", {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    } else {
      store.delete(VIEW_COOKIE);
    }
    return ok({ mode });
  });
}
