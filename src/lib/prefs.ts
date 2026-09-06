// Per-device client preferences (localStorage). Safe to read/write with guards.

const REVIEW_LIMIT_KEY = "engboost.reviewLimit";
const AUTOSPEAK_KEY = "engboost.autoSpeak";

export const DEFAULT_REVIEW_LIMIT = 20;

export function getReviewLimit(): number {
  try {
    const v = Number(localStorage.getItem(REVIEW_LIMIT_KEY));
    if (Number.isFinite(v) && v >= 1 && v <= 200) return v;
  } catch {
    /* ignore */
  }
  return DEFAULT_REVIEW_LIMIT;
}

export function setReviewLimit(n: number) {
  try {
    localStorage.setItem(REVIEW_LIMIT_KEY, String(n));
  } catch {
    /* ignore */
  }
}

export function getAutoSpeak(): boolean {
  try {
    return localStorage.getItem(AUTOSPEAK_KEY) === "1";
  } catch {
    return false;
  }
}

export function setAutoSpeak(b: boolean) {
  try {
    localStorage.setItem(AUTOSPEAK_KEY, b ? "1" : "0");
  } catch {
    /* ignore */
  }
}
