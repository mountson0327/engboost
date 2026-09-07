export type Theme = "light" | "dark" | "system";
export const THEME_COOKIE = "theme";
// Light mode is the default: a white canvas with Van Gogh pigment gradients.
// Dark mode remains available as the Starry Night variant.
export const DEFAULT_THEME: Theme = "light";
// "system" is still supported for old cookies, but no longer offered as a choice.
export const THEMES: Theme[] = ["light", "dark"];

export function isTheme(v: unknown): v is Theme {
  return v === "light" || v === "dark" || v === "system";
}

/** Whether the given theme resolves to dark right now (system uses matchMedia). */
export function resolveDark(theme: Theme): boolean {
  if (theme === "dark") return true;
  if (theme === "light") return false;
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

/** Apply a theme immediately (toggle .dark on <html>) and persist it. */
export function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", resolveDark(theme));
  try {
    document.cookie = `${THEME_COOKIE}=${theme}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    /* ignore */
  }
}

/** Read the saved theme on the client (from cookie). */
export function readTheme(): Theme {
  if (typeof document === "undefined") return DEFAULT_THEME;
  const m = document.cookie.match(/(?:^|; )theme=([^;]+)/);
  const v = m ? decodeURIComponent(m[1]) : DEFAULT_THEME;
  return isTheme(v) ? v : DEFAULT_THEME;
}

// Blocking inline script that sets the .dark class before first paint (no FOUC).
export const THEME_INIT_SCRIPT = `(function(){try{var m=document.cookie.match(/(?:^|; )theme=([^;]+)/);var t=m?decodeURIComponent(m[1]):'light';var d=t==='dark'||(t==='system'&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.classList.toggle('dark',d);}catch(e){}})();`;
