import { prisma } from "@/lib/db";

// v1 is single-user. We keep one fixed demo user and attach all data to it.
// When multi-user lands, replace getCurrentUserId() with the authenticated id.
export const DEMO_USER_EMAIL = "me@engboost.local";

let cachedUserId: string | null = null;

/**
 * Returns the current user's id, creating the single demo user on first use.
 * Centralised so swapping in real auth later touches exactly one place.
 */
export async function getCurrentUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;

  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { email: DEMO_USER_EMAIL, name: "Me" },
  });

  cachedUserId = user.id;
  return user.id;
}
