"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PencilIcon } from "@animateicons/react/lucide";
import { api } from "@/lib/client";
import type { Card as CardType, Deck, GeneratedCard } from "@/lib/types";
import { SpeakButton } from "@/components/SpeakButton";
import { PracticePanel } from "@/components/PracticePanel";
import { EmptyState } from "@/components/EmptyState";
import {
  cardsToJson,
  cardsToCsv,
  downloadFile,
  parseImport,
  templateCsv,
} from "@/lib/io";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ReviewLink } from "@/components/ReviewLink";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/provider";
import type { TKey } from "@/lib/i18n/dictionaries";

const STATE_KEY: Record<CardType["state"], TKey> = {
  new: "state.new",
  learning: "state.learning",
  review: "state.review",
  mastered: "state.mastered",
};

export default function DeckDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { t } = useI18n();
  const { id } = use(params);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [error, setError] = useState("");

  const [term, setTerm] = useState("");
  const [ipa, setIpa] = useState("");
  const [pos, setPos] = useState("");
  const [meaningEn, setMeaningEn] = useState("");
  const [meaningVi, setMeaningVi] = useState("");
  const [examples, setExamples] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [aiNote, setAiNote] = useState("");

  const [ioNote, setIoNote] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Rename deck
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [descInput, setDescInput] = useState("");
  const [savingName, setSavingName] = useState(false);
  const renameIconRef = useRef<{
    startAnimation: () => void;
    stopAnimation: () => void;
  }>(null);

  async function load() {
    try {
      setDeck(await api<Deck>(`/api/decks/${id}`));
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function resetForm() {
    setTerm("");
    setIpa("");
    setPos("");
    setMeaningEn("");
    setMeaningVi("");
    setExamples("");
    setAiNote("");
  }

  async function generate() {
    if (!term.trim()) return;
    setGenerating(true);
    setAiNote("");
    try {
      const g = await api<GeneratedCard>("/api/ai/generate-card", {
        method: "POST",
        json: { term },
      });
      setIpa(g.ipa);
      setPos(g.pos);
      setMeaningEn(g.meaningEn);
      setMeaningVi(g.meaningVi);
      setExamples(g.examples.join("\n"));
      setAiNote(
        g.source === "claude" ? t("deck.aiNoteClaude") : t("deck.aiNoteFallback"),
      );
    } catch (e) {
      setError(String(e));
    } finally {
      setGenerating(false);
    }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!term.trim()) return;
    setSaving(true);
    try {
      await api("/api/cards", {
        method: "POST",
        json: {
          deckId: id,
          term,
          ipa,
          pos,
          meaningEn,
          meaningVi,
          examples: examples
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      resetForm();
      load();
    } catch (e) {
      setError(String(e));
    } finally {
      setSaving(false);
    }
  }

  async function removeCard(cardId: string) {
    if (!confirm(t("deck.confirmDeleteCard"))) return;
    await api(`/api/cards/${cardId}`, { method: "DELETE" });
    load();
  }

  function startEditName() {
    if (!deck) return;
    setNameInput(deck.name);
    setDescInput(deck.description ?? "");
    setEditingName(true);
  }

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    if (!nameInput.trim()) return;
    setSavingName(true);
    try {
      await api(`/api/decks/${id}`, {
        method: "PATCH",
        json: { name: nameInput.trim(), description: descInput.trim() || null },
      });
      setEditingName(false);
      load();
    } catch (err) {
      setError(String(err));
    } finally {
      setSavingName(false);
    }
  }

  function slug(name: string) {
    return name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
  }

  function exportJson() {
    if (!deck?.cards?.length) return setIoNote(t("io.exportEmpty"));
    downloadFile(
      `${slug(deck.name)}.json`,
      cardsToJson(deck.cards),
      "application/json",
    );
  }

  function exportCsv() {
    if (!deck?.cards?.length) return setIoNote(t("io.exportEmpty"));
    downloadFile(`${slug(deck.name)}.csv`, cardsToCsv(deck.cards), "text/csv");
  }

  async function onImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file) return;
    setImporting(true);
    setIoNote("");
    try {
      const text = await file.text();
      const { cards } = parseImport(text, file.name);
      if (cards.length === 0) {
        setIoNote(t("io.importError"));
        return;
      }
      const res = await api<{ imported: number }>(`/api/decks/${id}/import`, {
        method: "POST",
        json: { cards },
      });
      setIoNote(t("io.importDone", { count: res.imported }));
      load();
    } catch {
      setIoNote(t("io.importError"));
    } finally {
      setImporting(false);
    }
  }

  if (error) return <p className="text-danger">{error}</p>;
  if (!deck) return <p className="text-muted-foreground">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <Link
        href="/decks"
        className="text-sm text-muted-foreground hover:text-primary"
      >
        {t("deck.back")}
      </Link>
      <div className="flex flex-wrap items-start justify-between gap-3">
        {editingName ? (
          <form onSubmit={saveName} className="flex-1 space-y-2">
            <Input
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              placeholder={t("decks.namePlaceholder")}
              autoFocus
            />
            <Input
              value={descInput}
              onChange={(e) => setDescInput(e.target.value)}
              placeholder={t("decks.descPlaceholder")}
            />
            <div className="flex gap-2">
              <Button
                type="submit"
                size="sm"
                disabled={savingName || !nameInput.trim()}
              >
                {savingName ? t("deck.saving") : t("common.save")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => setEditingName(false)}
              >
                {t("common.cancel")}
              </Button>
            </div>
          </form>
        ) : (
          <div className="flex items-center gap-1.5">
            <div>
              <h1 className="text-2xl font-bold">{deck.name}</h1>
              {deck.description && (
                <p className="text-muted-foreground">{deck.description}</p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={startEditName}
              onMouseEnter={() => renameIconRef.current?.startAnimation()}
              onMouseLeave={() => renameIconRef.current?.stopAnimation()}
              title={t("deck.rename")}
            >
              <PencilIcon ref={renameIconRef} size={16} />
            </Button>
          </div>
        )}
        {!editingName && (
          <ReviewLink
            href={`/review?deckId=${deck.id}`}
            label={t("deck.reviewThis")}
          />
        )}
      </div>

      {/* Import / Export */}
      <Card className="p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={exportJson}>
            {t("io.exportJson")}
          </Button>
          <Button variant="outline" size="sm" onClick={exportCsv}>
            {t("io.exportCsv")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              downloadFile("engboost-template.csv", templateCsv(), "text/csv")
            }
            title={t("io.templateHint")}
          >
            {t("io.templateCsv")}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
          >
            {importing ? t("io.importing") : t("io.import")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={onImportFile}
          />
          {ioNote && <span className="text-xs text-success">{ioNote}</span>}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">{t("io.importHint")}</p>
      </Card>

      {/* Add card */}
      <Card className="p-4">
        <form onSubmit={save} className="space-y-3">
          <h2 className="font-semibold">{t("deck.addTitle")}</h2>
          <div className="flex gap-2">
            <Input
              placeholder={t("deck.termPlaceholder")}
              value={term}
              onChange={(e) => setTerm(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              onClick={generate}
              disabled={generating || !term.trim()}
              className="h-9 whitespace-nowrap"
            >
              {generating ? t("deck.aiFilling") : t("deck.aiFill")}
            </Button>
          </div>
          {aiNote && <p className="text-xs text-primary">{aiNote}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <Input
              placeholder={t("deck.ipaPlaceholder")}
              value={ipa}
              onChange={(e) => setIpa(e.target.value)}
            />
            <Input
              placeholder={t("deck.posPlaceholder")}
              value={pos}
              onChange={(e) => setPos(e.target.value)}
            />
          </div>
          <Input
            placeholder={t("deck.meaningEnPlaceholder")}
            value={meaningEn}
            onChange={(e) => setMeaningEn(e.target.value)}
          />
          <Input
            placeholder={t("deck.meaningViPlaceholder")}
            value={meaningVi}
            onChange={(e) => setMeaningVi(e.target.value)}
          />
          <Textarea
            placeholder={t("deck.examplesPlaceholder")}
            rows={2}
            value={examples}
            onChange={(e) => setExamples(e.target.value)}
          />
          <Button type="submit" disabled={saving}>
            {saving ? t("deck.saving") : t("deck.saveCard")}
          </Button>
        </form>
      </Card>

      {/* Cards list */}
      <div className="space-y-2">
        <h2 className="font-semibold">
          {t("deck.cardsTitle", { count: deck.cards?.length ?? 0 })}
        </h2>
        {deck.cards?.length === 0 ? (
          <EmptyState message={t("deck.noCards")} />
        ) : (
          deck.cards?.map((c) => (
            <Card key={c.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-lg font-semibold">{c.term}</span>
                    {c.ipa && (
                      <span className="text-sm text-muted-foreground">
                        {c.ipa}
                      </span>
                    )}
                    {c.pos && (
                      <Badge variant="secondary" className="font-normal">
                        {c.pos}
                      </Badge>
                    )}
                    <SpeakButton
                      text={c.term}
                      size="icon-xs"
                      iconSize={14}
                      title={t("common.speak")}
                    />
                    <Badge variant="outline">{t(STATE_KEY[c.state])}</Badge>
                  </div>
                  {c.meaningVi && <p className="mt-1 text-sm">{c.meaningVi}</p>}
                  {c.meaningEn && (
                    <p className="text-sm text-muted-foreground">{c.meaningEn}</p>
                  )}
                  {c.examples.length > 0 && (
                    <ul className="mt-1 list-disc pl-5 text-sm text-muted-foreground">
                      {c.examples.map((ex, i) => (
                        <li key={i}>{ex}</li>
                      ))}
                    </ul>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => removeCard(c.id)}
                  title="Xoá thẻ"
                >
                  ✕
                </Button>
              </div>
              <PracticePanel card={c} />
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
