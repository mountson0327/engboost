import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AuthError, ForbiddenError } from "@/lib/auth";

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init);
}

export function badRequest(message: string, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status: 400 });
}

export function notFound(message = "Not found") {
  return NextResponse.json({ error: message }, { status: 404 });
}

/** Wraps a handler, turning ZodErrors into 400s and other throws into 500s. */
export async function handle<T>(fn: () => Promise<T>) {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ZodError) {
      return badRequest("Dữ liệu không hợp lệ", err.flatten());
    }
    if (err instanceof AuthError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    if (err instanceof ForbiddenError) {
      return NextResponse.json({ error: err.message }, { status: 403 });
    }
    console.error("[api]", err);
    return NextResponse.json(
      { error: "Lỗi máy chủ", detail: String(err) },
      { status: 500 },
    );
  }
}
