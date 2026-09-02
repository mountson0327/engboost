"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/client";
import type { Deck } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n/provider";
import { parseImport } from "@/lib/io";

export default function DecksPage() {
  const { t } = useI18n();
  const [decks, setDecks] = useState<Deck[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [ioNote, setIoNote] = useState("");
  const [importing, setImporting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    try {
      setDecks(await api<Deck[]>("/api/decks"));
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    try {
      await api("/api/decks", { method: "POST", json: { name, description } });
      setName("");
      setDescription("");
      load();
    } catch (e) {
      setError(String(e));
    }
  }

  async function remove(id: string) {
    if (!confirm(t("decks.confirmDelete"))) return;
    await api(`/api/decks/${id}`, { method: "DELETE" });
    load();
  }

  async function onImportDeck(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImporting(true);
    setIoNote("");
    try {
      const text = await file.text();
      const parsed = parseImport(text, file.name);
      if (parsed.cards.length === 0) {
        setIoNote(t("io.importError"));
        return;
      }
      // Deck name: from file content, else the file name without extension.
      const deckName = parsed.name ?? file.name.replace(/\.[^.]+$/, "");
      const res = await api<{ imported: number }>("/api/decks/import", {
        method: "POST",
        json: {
          name: deckName,
          description: parsed.description ?? null,
          cards: parsed.cards,
        },
      });
      setIoNote(t("io.importDone", { count: res.imported }));
      load();
    } catch {
      setIoNote(t("io.importError"));
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{t("decks.title")}</h1>
        <div className="flex items-center gap-2">
          {ioNote && <span className="text-xs text-success">{ioNote}</span>}
          <Button
            variant="outline"
            size="sm"
            onClick={() => fileRef.current?.click()}
            disabled={importing}
            title={t("decks.importDeckHint")}
          >
            {importing ? t("io.importing") : t("decks.importDeck")}
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.csv,application/json,text/csv"
            className="hidden"
            onChange={onImportDeck}
          />
        </div>
      </div>

      <Card className="p-4">
        <form onSubmit={create} className="space-y-3">
          <h2 className="font-semibold">{t("decks.createTitle")}</h2>
          <Input
            placeholder={t("decks.namePlaceholder")}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Input
            placeholder={t("decks.descPlaceholder")}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <Button type="submit">{t("decks.createBtn")}</Button>
        </form>
      </Card>

      {error && <p className="text-sm text-danger">{error}</p>}
      {loading ? (
        <p className="text-muted-foreground">{t("common.loading")}</p>
      ) : decks.length === 0 ? (
        <p className="text-muted-foreground">{t("decks.empty")}</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {decks.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between">
                <Link
                  href={`/decks/${d.id}`}
                  className="font-semibold hover:text-primary"
                >
                  {d.name}
                </Link>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(d.id)}
                  title="Xoá"
                >
                  ✕
                </Button>
              </div>
              {d.description && (
                <p className="text-sm text-muted-foreground">{d.description}</p>
              )}
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {d._count?.cards ?? 0} {t("common.cards")}
                </span>
                <Link href={`/decks/${d.id}`} className="font-medium text-primary">
                  {t("common.open")}
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
