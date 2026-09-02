import { handle, ok } from "@/lib/api";
import { lookupSchema } from "@/lib/validation/schemas";
import { generateCard } from "@/lib/ai/claude";

// POST /api/lookup { word } -> quick meaning for the clicked word.
// Tries the free Dictionary API first (no key needed), then falls back to
// Claude / the offline generator so it always returns something useful.
export async function POST(request: Request) {
  return handle(async () => {
    const { word } = lookupSchema.parse(await request.json());
    const clean = word.trim().toLowerCase();

    const fromDict = await tryDictionaryApi(clean);
    if (fromDict) return ok(fromDict);

    const card = await generateCard(clean);
    return ok({
      term: card.term,
      ipa: card.ipa,
      pos: card.pos,
      meaningEn: card.meaningEn,
      meaningVi: card.meaningVi,
      examples: card.examples,
      source: card.source,
    });
  });
}

async function tryDictionaryApi(word: string) {
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
      { signal: AbortSignal.timeout(4000) },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as DictEntry[];
    const entry = data[0];
    if (!entry) return null;

    const ipa =
      entry.phonetic ||
      entry.phonetics?.find((p) => p.text)?.text ||
      "";
    const firstMeaning = entry.meanings?.[0];
    const def = firstMeaning?.definitions?.[0];
    const examples = entry.meanings
      ?.flatMap((m) => m.definitions.map((d) => d.example))
      .filter((e): e is string => Boolean(e))
      .slice(0, 2);

    return {
      term: entry.word,
      ipa,
      pos: firstMeaning?.partOfSpeech ?? "",
      meaningEn: def?.definition ?? "",
      meaningVi: "",
      examples: examples ?? [],
      source: "dictionary" as const,
    };
  } catch {
    return null;
  }
}

type DictEntry = {
  word: string;
  phonetic?: string;
  phonetics?: { text?: string }[];
  meanings?: {
    partOfSpeech?: string;
    definitions: { definition: string; example?: string }[];
  }[];
};
