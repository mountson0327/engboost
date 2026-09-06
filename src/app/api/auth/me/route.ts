import { handle, ok } from "@/lib/api";
import { getCurrentUser, getViewMode } from "@/lib/auth";

// GET /api/auth/me -> current user + effective role + view mode
export async function GET() {
  return handle(async () => {
    const user = await getCurrentUser();
    if (!user) return ok({ user: null });
    const viewMode = await getViewMode();
    const effectiveRole =
      user.role === "admin" && viewMode === "user" ? "user" : user.role;
    return ok({ user, effectiveRole, viewMode });
  });
}
