import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export type Role = "admin" | "user";
export type SessionData = { userId: string; role: Role };

export const SESSION_COOKIE = "eb_session";
export const VIEW_COOKIE = "eb_view"; // admin "act as user" toggle
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function secretKey() {
  const s = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  return new TextEncoder().encode(s);
}

// Thrown when a request has no valid session; lib/api handle() maps it to 401.
export class AuthError extends Error {
  constructor(message = "Chưa đăng nhập") {
    super(message);
    this.name = "AuthError";
  }
}
export class ForbiddenError extends Error {
  constructor(message = "Không đủ quyền") {
    super(message);
    this.name = "ForbiddenError";
  }
}

// ---- password ----
export function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}
export function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

// ---- session token ----
export async function signSession(data: SessionData): Promise<string> {
  return new SignJWT({ role: data.role })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(data.userId)
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secretKey());
}

export async function verifySessionToken(
  token: string,
): Promise<SessionData | null> {
  try {
    const { payload } = await jwtVerify(token, secretKey());
    const role = payload.role === "admin" ? "admin" : "user";
    return payload.sub ? { userId: payload.sub, role } : null;
  } catch {
    return null;
  }
}

// ---- cookie helpers (call inside Route Handlers / Server Actions) ----
export async function setSessionCookie(data: SessionData) {
  const token = await signSession(data);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}
export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
  store.delete(VIEW_COOKIE);
}

// ---- reading the current session/user ----
export async function getSession(): Promise<SessionData | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return verifySessionToken(token);
}

export async function getViewMode(): Promise<"admin" | "user" | null> {
  const store = await cookies();
  const v = store.get(VIEW_COOKIE)?.value;
  return v === "user" ? "user" : v === "admin" ? "admin" : null;
}

/** The role the app should enforce right now (admin may "act as user"). */
export async function getEffectiveRole(): Promise<Role> {
  const s = await getSession();
  if (!s) return "user";
  if (s.role === "admin" && (await getViewMode()) === "user") return "user";
  return s.role;
}

export async function getCurrentUser() {
  const s = await getSession();
  if (!s) return null;
  return prisma.user.findUnique({
    where: { id: s.userId },
    select: { id: true, email: true, name: true, role: true },
  });
}

/** Require a logged-in user id (throws AuthError -> 401 via handle()). */
export async function requireUserId(): Promise<string> {
  const s = await getSession();
  if (!s) throw new AuthError();
  return s.userId;
}

/** Require an admin (real role, regardless of view mode). */
export async function requireAdmin(): Promise<string> {
  const s = await getSession();
  if (!s) throw new AuthError();
  if (s.role !== "admin") throw new ForbiddenError();
  return s.userId;
}
