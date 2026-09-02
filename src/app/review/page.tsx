"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api } from "@/lib/client";
import type { Card as CardType } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { SpeakButton } from "@/components/SpeakButton";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";

type GradeKey = "again" | "hard" | "good" | "easy";

const GRADES: { key: GradeKey; label: string; cls: string }[] = [
  { key: "again", label: "Again", cls: "bg-danger text-white hover:bg-danger/90" },
  { key: "hard", label: "Hard", cls: "bg-warning text-white hover:bg-warning/90" },
  { key: "good", label: "Good", cls: "bg-success text-white hover:bg-success/90" },
  { key: "easy", label: "Easy", cls: "" }, // default primary
];

function ReviewInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const deckId = searchParams.get("deckId") ?? undefined;

  const [queue, setQueue] = useState<CardType[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(0);
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    try {
      const qs = deckId ? `?deckId=${deckId}&limit=50` : "?limit=50";
      const cards = await api<CardType[]>(`/api/review${qs}`);
      setQueue(cards);
      setIdx(0);
      setShowBack(false);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deckId]);

  const current = queue[idx];

  async function grade(g: GradeKey) {
    if (!current) return;
    try {
      await api("/api/review", {
        method: "POST",
        json: { cardId: current.id, grade: g },
      });
      setDone((d) => d + 1);
      setShowBack(false);
      setIdx((i) => i + 1);
    } catch (e) {
      setError(String(e));
    }
  }

  if (loading) return <p className="text-muted-foreground">{t("common.loading")}</p>;
  if (error) return <p className="text-danger">{error}</p>;

  if (!current) {
    return (
      <Card className="mx-auto max-w-md p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-xl font-bold">{t("review.doneTitle")}</h1>
        <p className="text-muted-foreground">
          {t("review.doneBody", { done })}
        </p>
        <div className="flex justify-center gap-2">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}>
            {t("review.home")}
          </Link>
          <Link href="/decks" className={cn(buttonVariants(), "h-9 px-4")}>
            {t("review.addCards")}
          </Link>
        </div>
      </Card>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>{t("review.remaining", { left: queue.length - idx, done })}</span>
        {current.deck && <span>{current.deck.name}</span>}
      </div>

      <Card
        className="min-h-64 cursor-pointer justify-center p-8 text-center"
        onClick={() => setShowBack((s) => !s)}
      >
        <div className="flex items-center justify-center gap-2">
          <span className="text-3xl font-bold">{current.term}</span>
          <SpeakButton
            text={current.term}
            size="icon"
            iconSize={22}
            stopPropagation
            title={t("common.speak")}
          />
        </div>
        {current.ipa && (
          <div className="text-muted-foreground">{current.ipa}</div>
        )}

        {!showBack ? (
          <p className="mt-6 text-sm text-muted-foreground">
            {t("review.tapToSee")}
          </p>
        ) : (
          <div className="mt-4 space-y-2 text-left">
            {current.meaningVi && (
              <p className="text-lg font-medium">{current.meaningVi}</p>
            )}
            {current.meaningEn && (
              <p className="text-muted-foreground">{current.meaningEn}</p>
            )}
            {current.examples.length > 0 && (
              <ul className="list-disc pl-5 text-sm text-muted-foreground">
                {current.examples.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </Card>

      {showBack ? (
        <div className="grid grid-cols-4 gap-2">
          {GRADES.map((g) => (
            <Button
              key={g.key}
              onClick={() => grade(g.key)}
              className={cn("h-10", g.cls)}
            >
              {g.label}
            </Button>
          ))}
        </div>
      ) : (
        <Button onClick={() => setShowBack(true)} className="h-10 w-full">
          {t("review.showAnswer")}
        </Button>
      )}
    </div>
  );
}

export default function ReviewPage() {
  return (
    <Suspense fallback={<p className="text-muted-foreground">Đang tải…</p>}>
      <ReviewInner />
    </Suspense>
  );
}
