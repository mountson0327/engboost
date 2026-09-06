import { requireUserId } from "@/lib/auth";

// The single demo user's email — used by the seed and by the "first registration
// claims the existing data" logic in the register route.
export const DEMO_USER_EMAIL = "me@engboost.local";

/**
 * The current user's id from the auth session. Throws AuthError (-> 401) when
 * not logged in, so every API route that owns data is protected automatically.
 */
export async function getCurrentUserId(): Promise<string> {
  return requireUserId();
}
