"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import type { Deck } from "@/lib/types";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/provider";
import { useAuth } from "@/lib/auth-client";

type TrashDeck = Deck & { deletedAt: string };

export default function TrashPage() {
  const { t } = useI18n();
  const { effectiveRole } = useAuth();
  const [decks, setDecks] = useState<TrashDeck[]>([]);
  const [error, setError] = useState("");

  async function load() {
    try {
      setDecks(await api<TrashDeck[]>("/api/decks/trash"));
    } catch (e) {
      setError(String(e));
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function restore(id: string) {
    await api(`/api/decks/${id}/restore`, { method: "POST" });
    load();
  }

  async function purge(id: string) {
    if (!confirm(t("trash.confirmPurge"))) return;
    await api(`/api/decks/${id}/purge`, { method: "DELETE" });
    load();
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("trash.title")}</h1>
      {error && <p className="text-sm text-danger">{error}</p>}

      {decks.length === 0 ? (
        <p className="text-muted-foreground">{t("trash.empty")}</p>
      ) : (
        <div className="space-y-2">
          {decks.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="truncate font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground">
                    {d._count?.cards ?? 0} {t("common.cards")} ·{" "}
                    {t("trash.deletedOn", {
                      date: new Date(d.deletedAt).toLocaleDateString("vi-VN"),
                    })}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm" onClick={() => restore(d.id)}>
                    {t("trash.restore")}
                  </Button>
                  {effectiveRole === "admin" && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => purge(d.id)}
                      className="text-danger hover:text-danger"
                    >
                      {t("trash.purge")}
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
