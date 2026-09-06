"use client";

import { useEffect, useState } from "react";
import { api } from "@/lib/client";
import { StatCard } from "@/components/StatCard";
import { useI18n } from "@/lib/i18n/provider";

type Stats = { users: number; admins: number; decks: number; cards: number };

export default function AdminOverviewPage() {
  const { t } = useI18n();
  const [stats, setStats] = useState<Stats | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Stats>("/api/admin/stats")
      .then(setStats)
      .catch((e) => setError(String(e)));
  }, []);

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{t("admin.overviewTitle")}</h1>
      {error && <p className="text-sm text-danger">{error}</p>}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("admin.totalUsers")} value={stats?.users ?? "…"} />
        <StatCard label={t("admin.adminCount")} value={stats?.admins ?? "…"} />
        <StatCard label={t("admin.totalDecks")} value={stats?.decks ?? "…"} />
        <StatCard label={t("admin.totalCards")} value={stats?.cards ?? "…"} />
      </div>
    </div>
  );
}
