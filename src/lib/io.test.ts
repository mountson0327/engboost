import { describe, it, expect } from "vitest";
import { cardsToCsv, cardsToJson, parseImport, type ImportCard } from "./io";

const cards: ImportCard[] = [
  {
    term: "resilient",
    ipa: "/rɪˈzɪliənt/",
    pos: "adjective",
    meaningEn: "able to recover quickly",
    meaningVi: "kiên cường",
    examples: ["She is resilient.", "A resilient, tough material"],
  },
  {
    term: "hello, world",
    meaningVi: 'câu "kinh điển"',
    examples: [],
  },
];

describe("io round-trip", () => {
  it("CSV export → import preserves terms and examples", () => {
    const csv = cardsToCsv(cards);
    const { cards: parsed } = parseImport(csv, "deck.csv");
    expect(parsed).toHaveLength(2);
    expect(parsed[0].term).toBe("resilient");
    expect(parsed[0].examples).toEqual([
      "She is resilient.",
      "A resilient, tough material",
    ]);
    // Field with a comma must survive CSV quoting.
    expect(parsed[1].term).toBe("hello, world");
    expect(parsed[1].meaningVi).toBe('câu "kinh điển"');
  });

  it("JSON export → import preserves data", () => {
    const json = cardsToJson(cards);
    const { cards: parsed } = parseImport(json, "deck.json");
    expect(parsed).toHaveLength(2);
    expect(parsed[0].meaningVi).toBe("kiên cường");
    expect(parsed[0].examples).toHaveLength(2);
  });

  it("JSON with deck wrapper exposes name + cards", () => {
    const json = JSON.stringify({
      name: "My Deck",
      description: "desc",
      cards: [{ term: "apple", meaningVi: "quả táo" }],
    });
    const parsed = parseImport(json, "x.json");
    expect(parsed.name).toBe("My Deck");
    expect(parsed.cards).toHaveLength(1);
  });

  it("skips rows without a term", () => {
    const csv = "term,meaningVi\n,empty\napple,quả táo";
    const { cards: parsed } = parseImport(csv, "d.csv");
    expect(parsed).toHaveLength(1);
    expect(parsed[0].term).toBe("apple");
  });
});
