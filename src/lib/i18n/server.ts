import { cookies } from "next/headers";
import {
  DEFAULT_LANG,
  LANG_COOKIE,
  isLang,
  translate,
  type Lang,
  type TKey,
  type TParams,
} from "./dictionaries";

/** Read the current language from the cookie (server components). */
export async function getLang(): Promise<Lang> {
  const store = await cookies();
  const value = store.get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

/** A translate function bound to the current language, for server components. */
export async function getT(): Promise<(key: TKey, params?: TParams) => string> {
  const lang = await getLang();
  return (key, params) => translate(lang, key, params);
}
