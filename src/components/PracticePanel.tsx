"use client";

import { useRef, useState } from "react";
import { PencilIcon } from "@animateicons/react/lucide";
import { api } from "@/lib/client";
import type { Card, SentencePractice } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

function scoreClass(score: number) {
  if (score >= 8) return "bg-success/15 text-success";
  if (score >= 5) return "bg-warning/15 text-warning";
  return "bg-danger/15 text-danger";
}

function ScoreBadge({
  practice,
}: {
  practice: Pick<SentencePractice, "score" | "cefr">;
}) {
  if (practice.score == null) return null;
  return (
    <Badge className={cn("font-semibold", scoreClass(practice.score))}>
      {practice.score}/10
      {practice.cefr ? ` · ${practice.cefr}` : ""}
    </Badge>
  );
}

function ReviewResult({ r }: { r: SentencePractice }) {
  const { t } = useI18n();
  const rows: [string, string | null][] = [
    [t("practice.corrected"), r.corrected],
    [t("practice.usage"), r.usage],
    [t("practice.natural"), r.natural],
    [t("practice.explanation"), r.explanation],
  ];
  return (
    <div className="space-y-1.5 rounded-lg bg-background p-3 text-sm">
      {rows.map(([label, value]) =>
        value ? (
          <p key={label}>
            <span className="font-medium text-muted-foreground">{label}: </span>
            <span>{value}</span>
          </p>
        ) : null,
      )}
    </div>
  );
}

export function PracticePanel({ card }: { card: Card }) {
  const { t } = useI18n();
  const initial = card.practices?.[0] ?? null;
  const [open, setOpen] = useState(false);
  const [sentence, setSentence] = useState(initial?.sentence ?? "");
  const [latest, setLatest] = useState<SentencePractice | null>(initial);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const iconRef = useRef<{
    startAnimation: () => void;
    stopAnimation: () => void;
  }>(null);

  async function check() {
    if (!sentence.trim()) {
      setErr(t("practice.empty"));
      return;
    }
    setLoading(true);
    setErr("");
    try {
      const r = await api<SentencePractice>("/api/practice", {
        method: "POST",
        json: { cardId: card.id, sentence },
      });
      setLatest(r);
    } catch (e) {
      setErr(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-2 border-t pt-2">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="gap-1.5"
          onClick={() => setOpen((o) => !o)}
          onMouseEnter={() => iconRef.current?.startAnimation()}
          onMouseLeave={() => iconRef.current?.stopAnimation()}
        >
          <PencilIcon ref={iconRef} size={14} />
          {open
            ? t("practice.hide")
            : latest
              ? t("practice.editButton")
              : t("practice.button")}
        </Button>
        {latest && !open && (
          <span className="min-w-0 flex-1 truncate text-xs text-muted-foreground">
            {t("practice.mySentence")}: “{latest.sentence}”
          </span>
        )}
        {latest && !open && <ScoreBadge practice={latest} />}
      </div>

      {open && (
        <div className="mt-2 space-y-2">
          <Textarea
            rows={2}
            value={sentence}
            onChange={(e) => setSentence(e.target.value)}
            placeholder={t("practice.placeholder")}
          />
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={check} disabled={loading}>
              {loading ? t("practice.checking") : t("practice.check")}
            </Button>
            {latest && <ScoreBadge practice={latest} />}
          </div>
          {err && <p className="text-xs text-danger">{err}</p>}
          {latest && <ReviewResult r={latest} />}
        </div>
      )}
    </div>
  );
}
