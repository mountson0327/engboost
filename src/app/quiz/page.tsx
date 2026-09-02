"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { Deck } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { NativeSelect } from "@/components/ui/native-select";
import { useI18n } from "@/lib/i18n/provider";

type QuizItem = {
  cardId: string;
  term: string;
  prompt: string;
  choices: string[];
  correct: string;
};

type Result = {
  score: number;
  total: number;
  wrong: { term: string; prompt: string; correct: string; chosen: string }[];
};

export default function QuizPage() {
  const { t } = useI18n();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");
  const [items, setItems] = useState<QuizItem[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api<Deck[]>("/api/decks").then(setDecks).catch((e) => setError(String(e)));
  }, []);

  async function start() {
    if (!deckId) return;
    setError("");
    setResult(null);
    setAnswers({});
    setLoading(true);
    try {
      const data = await api<{ items: QuizItem[] }>("/api/quiz", {
        method: "POST",
        json: { deckId, count: 10 },
      });
      setItems(data.items);
    } catch (e) {
      setError(String(e));
      setItems([]);
    } finally {
      setLoading(false);
    }
  }

  async function submit() {
    const payload = items.map((it) => ({
      cardId: it.cardId,
      term: it.term,
      prompt: it.prompt,
      choices: it.choices,
      correct: it.correct,
      chosen: answers[it.cardId] ?? "",
    }));
    try {
      const r = await api<Result>("/api/quiz/submit", {
        method: "POST",
        json: { deckId, items: payload },
      });
      setResult(r);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e) {
      setError(String(e));
    }
  }

  const allAnswered = items.length > 0 && items.every((it) => answers[it.cardId]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{t("quiz.title")}</h1>

      <Card className="p-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="flex-1">
            <Label className="mb-1">{t("quiz.pickDeck")}</Label>
            <NativeSelect
              value={deckId}
              onChange={(e) => setDeckId(e.target.value)}
            >
              <option value="">{t("quiz.selectPlaceholder")}</option>
              {decks.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d._count?.cards ?? 0} {t("common.cards")})
                </option>
              ))}
            </NativeSelect>
          </div>
          <Button onClick={start} disabled={!deckId || loading} className="h-9 px-4">
            {loading ? t("quiz.generating") : t("quiz.start")}
          </Button>
        </div>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}

      {result && (
        <Card className="p-5">
          <h2 className="text-lg font-bold">
            {t("quiz.result", { score: result.score, total: result.total })}
          </h2>
          {result.wrong.length > 0 ? (
            <>
              <p className="text-sm text-muted-foreground">{t("quiz.wrong")}</p>
              <ul className="space-y-1 text-sm">
                {result.wrong.map((w, i) => (
                  <li key={i}>
                    {t("quiz.wrongLine", {
                      prompt: w.prompt,
                      correct: w.correct,
                      chosen: w.chosen || "—",
                    })}
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="text-success">{t("quiz.allCorrect")}</p>
          )}
          <Button onClick={start} variant="outline" className="h-9 w-fit px-4">
            {t("quiz.retry")}
          </Button>
        </Card>
      )}

      {!result && items.length > 0 && (
        <div className="space-y-4">
          {items.map((it, qi) => (
            <Card key={it.cardId} className="p-4">
              <p className="font-medium">
                {t("quiz.question", { n: qi + 1, prompt: it.prompt })}
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                {it.choices.map((c) => {
                  const chosen = answers[it.cardId] === c;
                  return (
                    <Button
                      key={c}
                      variant={chosen ? "default" : "outline"}
                      onClick={() =>
                        setAnswers((a) => ({ ...a, [it.cardId]: c }))
                      }
                      className="h-9 justify-start"
                    >
                      {c}
                    </Button>
                  );
                })}
              </div>
            </Card>
          ))}
          <Button
            onClick={submit}
            disabled={!allAnswered}
            className="h-10 w-full"
          >
            {t("quiz.submit", {
              answered: Object.keys(answers).length,
              total: items.length,
            })}
          </Button>
        </div>
      )}

      {!result && items.length === 0 && !loading && (
        <p className="text-muted-foreground">
          {t("quiz.hint")}
          <Link href="/decks" className="text-primary">
            {t("quiz.createNow")}
          </Link>
          .
        </p>
      )}
    </div>
  );
}
