"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { api, speak } from "@/lib/client";
import type { Card as CardType, Deck } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { SpeakButton } from "@/components/SpeakButton";
import { NativeSelect } from "@/components/ui/native-select";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/dictionaries";
import { getReviewLimit, getAutoSpeak } from "@/lib/prefs";

type GradeKey = "again" | "hard" | "good" | "easy";

const GRADES: {
  key: GradeKey;
  labelKey: TKey;
  hintKey: TKey;
  cls: string;
}[] = [
  {
    key: "again",
    labelKey: "review.grade.again",
    hintKey: "review.grade.againHint",
    cls: "border-danger/55 !bg-white text-danger hover:!bg-danger/5 dark:!bg-card",
  },
  {
    key: "hard",
    labelKey: "review.grade.hard",
    hintKey: "review.grade.hardHint",
    cls: "border-[#a3945d]/70 !bg-white text-[#786d3f] hover:!bg-[#a3945d]/8 dark:!bg-card dark:text-[#dad69f]",
  },
  {
    key: "good",
    labelKey: "review.grade.good",
    hintKey: "review.grade.goodHint",
    cls: "border-success/55 !bg-white text-[#288f54] hover:!bg-success/5 dark:!bg-card dark:text-success",
  },
  {
    key: "easy",
    labelKey: "review.grade.easy",
    hintKey: "review.grade.easyHint",
    cls: "border-primary/55 !bg-white text-primary hover:!bg-primary/5 dark:!bg-card",
  },
];

function ReviewInner() {
  const { t } = useI18n();
  const searchParams = useSearchParams();

  const [decks, setDecks] = useState<Deck[]>([]);
  const [selectedDeckId, setSelectedDeckId] = useState<string>(
    searchParams.get("deckId") ?? "",
  );

  const [mode, setMode] = useState<"due" | "all">("due");
  const [queue, setQueue] = useState<CardType[]>([]);
  const [idx, setIdx] = useState(0);
  const [showBack, setShowBack] = useState(false);
  const [loading, setLoading] = useState(true);
  const [done, setDone] = useState(0);
  const [error, setError] = useState("");

  // Load the deck list for the picker (once).
  useEffect(() => {
    api<Deck[]>("/api/decks").then(setDecks).catch(() => {});
  }, []);

  async function load() {
    setLoading(true);
    try {
      const limit = getReviewLimit();
      const params = new URLSearchParams({ limit: String(limit) });
      if (selectedDeckId) params.set("deckId", selectedDeckId);
      if (mode === "all") params.set("all", "1");
      const cards = await api<CardType[]>(`/api/review?${params.toString()}`);
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
  }, [selectedDeckId, mode]);

  function changeMode(m: "due" | "all") {
    setMode(m);
    setDone(0);
  }

  function onChangeDeck(id: string) {
    setSelectedDeckId(id);
    setDone(0);
    // Keep the URL in sync so a refresh remembers the choice.
    if (typeof window !== "undefined") {
      window.history.replaceState(
        null,
        "",
        id ? `/review?deckId=${id}` : "/review",
      );
    }
  }

  const current = queue[idx];

  // Auto-pronounce the term when a new card appears (if enabled in settings).
  useEffect(() => {
    if (current && getAutoSpeak()) speak(current.term);
  }, [current?.id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const picker = (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">{t("review.pickDeck")}</span>
      <NativeSelect
        value={selectedDeckId}
        onChange={(e) => onChangeDeck(e.target.value)}
        className="max-w-xs"
      >
        <option value="">{t("review.allDecks")}</option>
        {decks.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name} ({d._count?.cards ?? 0})
          </option>
        ))}
      </NativeSelect>
      <div className="flex items-center rounded-lg border p-0.5">
        {(["due", "all"] as const).map((m) => (
          <button
            key={m}
            onClick={() => changeMode(m)}
            className={cn(
              "rounded-md px-2.5 py-1 text-xs font-medium transition-colors",
              mode === m
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {t(m === "due" ? "review.modeDue" : "review.modeAll")}
          </button>
        ))}
      </div>
    </div>
  );

  let content: React.ReactNode;
  if (loading) {
    content = <p className="text-muted-foreground">{t("common.loading")}</p>;
  } else if (error) {
    content = <p className="text-danger">{error}</p>;
  } else if (!current) {
    content = (
      <Card className="p-8 text-center">
        <div className="text-5xl">🎉</div>
        <h1 className="text-xl font-bold">{t("review.doneTitle")}</h1>
        <p className="text-muted-foreground">{t("review.doneBody", { done })}</p>
        <div className="flex flex-wrap justify-center gap-2">
          {mode === "due" && (
            <Button
              onClick={() => changeMode("all")}
              className="h-9 px-4"
            >
              ↻ {t("review.reviewAgain")}
            </Button>
          )}
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}>
            {t("review.home")}
          </Link>
          <Link href="/decks" className={cn(buttonVariants({ variant: "outline" }), "h-9 px-4")}>
            {t("review.addCards")}
          </Link>
        </div>
      </Card>
    );
  } else {
    content = (
      <>
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
        <div className="space-y-2">
          <p className="text-center text-sm font-medium text-muted-foreground">
            {t("review.gradePrompt")}
          </p>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {GRADES.map((g) => (
              <Button
                key={g.key}
                variant="outline"
                onClick={() => grade(g.key)}
                className={cn("h-auto min-h-14 flex-col gap-0.5 px-2 py-2", g.cls)}
              >
                <span className="font-semibold">{t(g.labelKey)}</span>
                <span className="text-[11px] font-normal opacity-70">
                  {t(g.hintKey)}
                </span>
              </Button>
            ))}
          </div>
        </div>
        ) : (
          <Button onClick={() => setShowBack(true)} className="h-10 w-full">
            {t("review.showAnswer")}
          </Button>
        )}
      </>
    );
  }

  return (
    <div className="mx-auto max-w-lg space-y-4">
      {picker}
      {content}
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
