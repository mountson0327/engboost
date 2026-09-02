"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { PencilIcon } from "@animateicons/react/lucide";
import { api, speak } from "@/lib/client";
import type { Deck } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/ui/native-select";
import { SpeakButton } from "@/components/SpeakButton";
import { useI18n } from "@/lib/i18n/provider";
import { cn } from "@/lib/utils";

type Lookup = {
  term: string;
  ipa: string;
  pos: string;
  meaningEn: string;
  meaningVi: string;
  examples: string[];
  source: string;
};

const SAMPLE =
  "Learning a new language takes patience and daily practice. " +
  "Reading short passages helps you meet useful words in context. " +
  "Click any word you do not know to see its meaning and save it to your deck.";

export default function ReadPage() {
  const { t } = useI18n();
  const [topic, setTopic] = useState("");
  const [level, setLevel] = useState("B1");
  const [text, setText] = useState(SAMPLE);
  const [generating, setGenerating] = useState(false);
  const [editing, setEditing] = useState(false);

  const [decks, setDecks] = useState<Deck[]>([]);
  const [deckId, setDeckId] = useState("");

  const [lookup, setLookup] = useState<Lookup | null>(null);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);
  const [looking, setLooking] = useState(false);
  const [saveNote, setSaveNote] = useState("");
  const editIconRef = useRef<{
    startAnimation: () => void;
    stopAnimation: () => void;
  }>(null);

  useEffect(() => {
    api<Deck[]>("/api/decks")
      .then((d) => {
        setDecks(d);
        if (d[0]) setDeckId(d[0].id);
      })
      .catch(() => {});
  }, []);

  const tokens = useMemo(() => text.split(/(\s+|[.,!?;:"'()]+)/), [text]);

  async function generate() {
    if (!topic.trim()) return;
    setGenerating(true);
    try {
      const r = await api<{ title: string; body: string }>("/api/ai/reading", {
        method: "POST",
        json: { topic, level },
      });
      setText(`${r.title}\n\n${r.body}`);
      setEditing(false);
      setLookup(null);
      setActiveIdx(null);
    } catch {
      /* ignore */
    } finally {
      setGenerating(false);
    }
  }

  async function onWord(raw: string, idx: number) {
    const word = raw.replace(/[^a-zA-Z-]/g, "");
    if (!word) return;
    setActiveIdx(idx);
    setLooking(true);
    setLookup(null);
    setSaveNote("");
    try {
      const l = await api<Lookup>("/api/lookup", {
        method: "POST",
        json: { word },
      });
      setLookup(l);
      speak(word);
    } catch {
      /* ignore */
    } finally {
      setLooking(false);
    }
  }

  async function addToDeck() {
    if (!lookup || !deckId) return;
    try {
      await api("/api/cards", {
        method: "POST",
        json: {
          deckId,
          term: lookup.term,
          ipa: lookup.ipa,
          pos: lookup.pos,
          meaningEn: lookup.meaningEn,
          meaningVi: lookup.meaningVi,
          examples: lookup.examples,
        },
      });
      setSaveNote(t("read.added"));
    } catch (e) {
      setSaveNote(String(e));
    }
  }

  function closeLookup() {
    setLookup(null);
    setActiveIdx(null);
    setLooking(false);
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("read.title")}</h1>

      {/* Controls */}
      <Card className="p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-48 flex-1">
            <Label className="mb-1">{t("read.topicLabel")}</Label>
            <Input
              placeholder={t("read.topicPlaceholder")}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
            />
          </div>
          <div>
            <Label className="mb-1">{t("read.levelLabel")}</Label>
            <NativeSelect
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-24"
            >
              {["A1", "A2", "B1", "B2", "C1"].map((l) => (
                <option key={l}>{l}</option>
              ))}
            </NativeSelect>
          </div>
          <Button
            onClick={generate}
            disabled={generating || !topic.trim()}
            className="h-9 px-4"
          >
            {generating ? t("read.generating") : t("read.generate")}
          </Button>
          <Button
            variant="outline"
            onClick={() => setEditing((v) => !v)}
            onMouseEnter={() => editIconRef.current?.startAnimation()}
            onMouseLeave={() => editIconRef.current?.stopAnimation()}
            className="h-9 gap-1.5 px-4"
          >
            <PencilIcon ref={editIconRef} size={16} />
            {editing ? t("read.doneEditing") : t("read.editText")}
          </Button>
        </div>
        {editing && (
          <Textarea
            className="mt-3 font-mono text-sm"
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("read.pastePlaceholder")}
          />
        )}
      </Card>

      <div className="grid items-start gap-4 md:grid-cols-[1fr_20rem]">
        {/* Reading passage */}
        <Card className="p-6">
          <div className="whitespace-pre-wrap text-[1.05rem] leading-9">
            {tokens.map((tok, i) =>
              /^[a-zA-Z][a-zA-Z-]*$/.test(tok) ? (
                <button
                  key={i}
                  onClick={() => onWord(tok, i)}
                  className={cn(
                    "cursor-pointer rounded px-0.5 align-baseline transition-colors",
                    activeIdx === i
                      ? "bg-primary/20 text-primary"
                      : "hover:bg-accent hover:text-accent-foreground",
                  )}
                >
                  {tok}
                </button>
              ) : (
                tok
              ),
            )}
          </div>
          <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
            {t("read.readingHint")}
          </p>
        </Card>

        {/* Lookup panel: sticky sidebar on desktop, bottom sheet on mobile */}
        <Card
          className={cn(
            "h-fit p-4 md:sticky md:top-20 md:self-start",
            lookup || looking
              ? "max-md:fixed max-md:inset-x-0 max-md:bottom-0 max-md:z-30 max-md:max-h-[70vh] max-md:overflow-y-auto max-md:rounded-b-none max-md:shadow-2xl"
              : "",
          )}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-semibold">{t("read.lookupTitle")}</h2>
            {(lookup || looking) && (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={closeLookup}
                className="md:hidden"
                title={t("read.close")}
              >
                ✕
              </Button>
            )}
          </div>

          {looking && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("read.lookingUp")}
            </p>
          )}
          {!looking && !lookup && (
            <p className="mt-2 text-sm text-muted-foreground">
              {t("read.clickWord")}
            </p>
          )}
          {lookup && (
            <div className="mt-2 space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold">{lookup.term}</span>
                <SpeakButton text={lookup.term} title={t("common.speak")} />
              </div>
              {lookup.ipa && (
                <div className="text-sm text-muted-foreground">{lookup.ipa}</div>
              )}
              {lookup.pos && (
                <div className="text-xs text-muted-foreground">{lookup.pos}</div>
              )}
              {lookup.meaningEn && <p className="text-sm">{lookup.meaningEn}</p>}
              {lookup.meaningVi && (
                <p className="text-sm text-muted-foreground">
                  {lookup.meaningVi}
                </p>
              )}
              {lookup.examples.length > 0 && (
                <ul className="list-disc pl-5 text-sm text-muted-foreground">
                  {lookup.examples.slice(0, 2).map((ex, i) => (
                    <li key={i}>{ex}</li>
                  ))}
                </ul>
              )}

              <div className="space-y-2 pt-2">
                <NativeSelect
                  value={deckId}
                  onChange={(e) => setDeckId(e.target.value)}
                >
                  {decks.length === 0 && (
                    <option value="">{t("read.noDeck")}</option>
                  )}
                  {decks.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </NativeSelect>
                <Button
                  onClick={addToDeck}
                  disabled={!deckId}
                  className="h-9 w-full"
                >
                  {t("read.addToDeck")}
                </Button>
                {saveNote && <p className="text-xs text-success">{saveNote}</p>}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
