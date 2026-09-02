// Import/export helpers for vocabulary cards (client-safe, no server imports).

export type ImportCard = {
  term: string;
  ipa?: string;
  pos?: string;
  meaningEn?: string;
  meaningVi?: string;
  examples?: string[];
};

// Looser shape for export: the DB cards have nullable fields.
export type ExportCard = {
  term: string;
  ipa?: string | null;
  pos?: string | null;
  meaningEn?: string | null;
  meaningVi?: string | null;
  examples?: string[] | null;
};

const CSV_HEADERS = [
  "term",
  "ipa",
  "pos",
  "meaningEn",
  "meaningVi",
  "examples",
] as const;

// Examples are joined by " | " inside a single CSV/JSON-friendly cell.
const EXAMPLE_SEP = " | ";

// ---- Export ---------------------------------------------------------------

export function cardsToJson(cards: ExportCard[]): string {
  return JSON.stringify(
    cards.map((c) => ({
      term: c.term,
      ipa: c.ipa ?? "",
      pos: c.pos ?? "",
      meaningEn: c.meaningEn ?? "",
      meaningVi: c.meaningVi ?? "",
      examples: c.examples ?? [],
    })),
    null,
    2,
  );
}

function csvEscape(value: string): string {
  // Quote fields containing comma, quote or newline; double up quotes.
  if (/[",\n\r]/.test(value)) {
    return `"${value.replaceAll('"', '""')}"`;
  }
  return value;
}

export function cardsToCsv(cards: ExportCard[]): string {
  const rows = cards.map((c) =>
    [
      c.term,
      c.ipa ?? "",
      c.pos ?? "",
      c.meaningEn ?? "",
      c.meaningVi ?? "",
      (c.examples ?? []).join(EXAMPLE_SEP),
    ]
      .map((v) => csvEscape(String(v)))
      .join(","),
  );
  return [CSV_HEADERS.join(","), ...rows].join("\n");
}

/** Trigger a client-side file download. */
export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// ---- Import (parsing) -----------------------------------------------------

/** Parse one CSV line into fields, respecting double-quoted values. */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(field);
      field = "";
    } else {
      field += ch;
    }
  }
  out.push(field);
  return out;
}

function normalizeCard(raw: Record<string, unknown>): ImportCard | null {
  const term = String(raw.term ?? "").trim();
  if (!term) return null;
  let examples: string[] = [];
  const ex = raw.examples;
  if (Array.isArray(ex)) {
    examples = ex.map((e) => String(e).trim()).filter(Boolean);
  } else if (typeof ex === "string" && ex.trim()) {
    examples = ex
      .split(/\||\n/)
      .map((e) => e.trim())
      .filter(Boolean);
  }
  return {
    term,
    ipa: str(raw.ipa),
    pos: str(raw.pos),
    meaningEn: str(raw.meaningEn),
    meaningVi: str(raw.meaningVi),
    examples,
  };
}

function str(v: unknown): string {
  return v == null ? "" : String(v).trim();
}

export type ParsedImport = {
  name?: string;
  description?: string;
  cards: ImportCard[];
};

/**
 * Parse a .json or .csv import file into cards (and optionally a deck name).
 * JSON accepts either an array of cards or `{ name, description, cards }`.
 */
export function parseImport(text: string, filename: string): ParsedImport {
  const isJson =
    filename.toLowerCase().endsWith(".json") || text.trim().startsWith("[") ||
    text.trim().startsWith("{");

  if (isJson) {
    const data = JSON.parse(text);
    if (Array.isArray(data)) {
      return { cards: data.map(normalizeCard).filter(Boolean) as ImportCard[] };
    }
    const cardsRaw = Array.isArray(data.cards) ? data.cards : [];
    return {
      name: typeof data.name === "string" ? data.name : undefined,
      description:
        typeof data.description === "string" ? data.description : undefined,
      cards: cardsRaw.map(normalizeCard).filter(Boolean) as ImportCard[],
    };
  }

  // CSV
  const lines = text
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);
  if (lines.length === 0) return { cards: [] };

  const header = parseCsvLine(lines[0]).map((h) => h.trim());
  // If the first row isn't a header, treat every row as data with default cols.
  const hasHeader = header.some((h) =>
    (CSV_HEADERS as readonly string[]).includes(h),
  );
  const cols = hasHeader ? header : [...CSV_HEADERS];
  const dataLines = hasHeader ? lines.slice(1) : lines;

  const cards = dataLines
    .map((line) => {
      const fields = parseCsvLine(line);
      const obj: Record<string, unknown> = {};
      cols.forEach((c, i) => (obj[c] = fields[i] ?? ""));
      return normalizeCard(obj);
    })
    .filter(Boolean) as ImportCard[];

  return { cards };
}
