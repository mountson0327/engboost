"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/client";
import type { ParagraphWriting } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

const TOPICS = [
  "My hometown",
  "A memorable trip",
  "Technology in education",
  "The benefits of reading",
  "My daily routine",
  "A person I admire",
  "Environmental protection",
  "Learning a new language",
  "My future goals",
  "The importance of exercise",
  "Social media: pros and cons",
  "A skill I want to learn",
];

function scoreClass(score: number) {
  if (score >= 8) return "bg-success/15 text-success";
  if (score >= 5) return "bg-warning/15 text-warning";
  return "bg-danger/15 text-danger";
}

function ScoreBadge({ score, cefr }: { score: number | null; cefr: string | null }) {
  if (score == null) return null;
  return (
    <Badge className={cn("font-semibold", scoreClass(score))}>
      {score}/10{cefr ? ` · ${cefr}` : ""}
    </Badge>
  );
}

function ReviewView({ r }: { r: ParagraphWriting }) {
  const { t } = useI18n();
  const rows: [string, string | null][] = [
    [t("write.corrected"), r.corrected],
    [t("write.feedback"), r.feedback],
    [t("write.improvements"), r.improvements],
  ];
  return (
    <div className="space-y-2 text-sm">
      {rows.map(([label, value]) =>
        value ? (
          <div key={label}>
            <span className="font-medium text-muted-foreground">{label}: </span>
            <span className="whitespace-pre-wrap">{value}</span>
          </div>
        ) : null,
      )}
    </div>
  );
}

export default function WritePage() {
  const { t } = useI18n();
  const [topic, setTopic] = useState("");
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ParagraphWriting | null>(null);
  const [history, setHistory] = useState<ParagraphWriting[]>([]);
  const [openId, setOpenId] = useState<string | null>(null);

  const words = useMemo(
    () => text.trim().split(/\s+/).filter(Boolean).length,
    [text],
  );

  async function loadHistory() {
    try {
      setHistory(await api<ParagraphWriting[]>("/api/writing"));
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    loadHistory();
  }, []);

  function suggest() {
    setTopic(TOPICS[Math.floor(Math.random() * TOPICS.length)]);
  }

  async function check() {
    setError("");
    if (!topic.trim()) return setError(t("write.needTopic"));
    if (!text.trim()) return setError(t("write.needText"));
    setLoading(true);
    setResult(null);
    try {
      const r = await api<ParagraphWriting>("/api/writing", {
        method: "POST",
        json: { topic, text },
      });
      setResult(r);
      loadHistory();
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{t("write.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("write.intro")}</p>
      </div>

      {/* Composer */}
      <Card className="p-4">
        <div className="space-y-3">
          <div>
            <Label className="mb-1">{t("write.topicLabel")}</Label>
            <div className="flex gap-2">
              <Input
                list="write-topics"
                placeholder={t("write.topicPlaceholder")}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
              />
              <datalist id="write-topics">
                {TOPICS.map((tp) => (
                  <option key={tp} value={tp} />
                ))}
              </datalist>
              <Button
                type="button"
                variant="outline"
                onClick={suggest}
                className="h-9 whitespace-nowrap"
              >
                {t("write.suggest")}
              </Button>
            </div>
          </div>

          <Textarea
            rows={8}
            placeholder={t("write.paragraphPlaceholder")}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />

          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {t("write.words", { n: words })}
            </span>
            <Button onClick={check} disabled={loading} className="h-9 px-4">
              {loading ? t("write.checking") : t("write.check")}
            </Button>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}
        </div>
      </Card>

      {/* Current result */}
      {result && (
        <Card className="p-5">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="font-semibold">{result.topic}</h2>
            <ScoreBadge score={result.score} cefr={result.cefr} />
          </div>
          <ReviewView r={result} />
        </Card>
      )}

      {/* History */}
      <div className="space-y-2">
        <h2 className="font-semibold">{t("write.history")}</h2>
        {history.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("write.noHistory")}</p>
        ) : (
          history.map((h) => (
            <Card key={h.id} className="p-4">
              <button
                onClick={() => setOpenId(openId === h.id ? null : h.id)}
                className="flex w-full items-center justify-between gap-2 text-left"
              >
                <span className="min-w-0 flex-1 truncate font-medium">
                  {h.topic}
                </span>
                <span className="flex items-center gap-2">
                  <ScoreBadge score={h.score} cefr={h.cefr} />
                  <span className="text-xs text-muted-foreground">
                    {new Date(h.createdAt).toLocaleDateString("vi-VN")}
                  </span>
                </span>
              </button>
              {openId === h.id && (
                <div className="mt-3 space-y-2 border-t pt-3">
                  <p className="whitespace-pre-wrap rounded-lg bg-background p-3 text-sm">
                    {h.text}
                  </p>
                  <ReviewView r={h} />
                </div>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
