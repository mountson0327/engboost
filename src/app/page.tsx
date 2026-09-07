import Link from "next/link";
import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { hasActiveAiKey } from "@/lib/ai/claude";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { ReviewLink } from "@/components/ReviewLink";
import { getT, getLang } from "@/lib/i18n/server";
import { cn } from "@/lib/utils";

// Always render fresh — this is a personal dashboard, not a static page.
export const dynamic = "force-dynamic";

type Stats = {
  ok: boolean;
  error?: string;
  decks: number;
  totalCards: number;
  dueToday: number;
  mastered: number;
  recentQuiz: { score: number; total: number; createdAt: Date }[];
};

async function loadStats(): Promise<Stats> {
  try {
    const userId = await getCurrentUserId();
    const [decks, totalCards, dueToday, mastered, recentQuiz] =
      await Promise.all([
        prisma.deck.count({ where: { userId, deletedAt: null } }),
        prisma.card.count({
          where: { deletedAt: null, deck: { userId, deletedAt: null } },
        }),
        prisma.card.count({
          where: {
            deletedAt: null,
            deck: { userId, deletedAt: null },
            dueDate: { lte: new Date() },
          },
        }),
        prisma.card.count({
          where: {
            deletedAt: null,
            deck: { userId, deletedAt: null },
            state: "mastered",
          },
        }),
        prisma.quizAttempt.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 3,
          select: { score: true, total: true, createdAt: true },
        }),
      ]);
    return { ok: true, decks, totalCards, dueToday, mastered, recentQuiz };
  } catch (err) {
    return {
      ok: false,
      error: String(err),
      decks: 0,
      totalCards: 0,
      dueToday: 0,
      mastered: 0,
      recentQuiz: [],
    };
  }
}

export default async function Dashboard() {
  const stats = await loadStats();
  const t = await getT();
  const lang = await getLang();
  const aiOn = await hasActiveAiKey();
  const dateLocale = lang === "vi" ? "vi-VN" : "en-US";

  return (
    <div className="space-y-7">
      <div className="hero-panel relative overflow-hidden rounded-3xl border p-6 sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-20 size-64 rounded-full bg-[#37cae5]/10 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 right-20 size-24 rounded-full bg-[#f5db37]/10 blur-2xl" />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-[#37cae5]">Your learning constellation</p>
            <h1 className="text-3xl font-bold tracking-tight text-[#fbefcb] sm:text-4xl">{t("dash.welcome")}</h1>
            <p className="mt-2 max-w-xl text-[#b4c2df]">{t("dash.subtitle")}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              className={
                stats.ok
                  ? "bg-success/15 text-success"
                  : "bg-danger/15 text-danger"
              }
            >
              <span
                className={cn(
                  "size-2 rounded-full",
                  stats.ok ? "bg-success" : "bg-danger",
                )}
              />
              {stats.ok ? t("dash.dbOk") : t("dash.dbError")}
            </Badge>
            <Badge variant="secondary">
              {aiOn ? t("dash.claudeOn") : t("dash.aiFallback")}
            </Badge>
          </div>
      </div>
      </div>

      {!stats.ok && (
        <Card className="border-danger p-4 text-sm">
          <p className="font-semibold text-danger">{t("dash.dbErrTitle")}</p>
          <p className="mt-1 text-muted-foreground">
            {t("dash.dbErrBody", { detail: stats.error ?? "" })}
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label={t("dash.stat.due")} value={stats.dueToday} />
        <StatCard label={t("dash.stat.total")} value={stats.totalCards} />
        <StatCard label={t("dash.stat.mastered")} value={stats.mastered} />
        <StatCard label={t("dash.stat.decks")} value={stats.decks} />
      </div>

      <div className="flex flex-wrap gap-3">
        <ReviewLink
          href="/review"
          label={t("dash.reviewNow", { count: stats.dueToday })}
        />
        <Link
          href="/decks"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}
        >
          {t("dash.manageDecks")}
        </Link>
        <Link
          href="/quiz"
          className={cn(buttonVariants({ variant: "outline", size: "lg" }), "h-10 px-4")}
        >
          {t("dash.doQuiz")}
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-2 font-semibold">{t("dash.quickStart")}</h2>
          <ol className="list-decimal space-y-1 pl-5 text-sm text-muted-foreground">
            <li>{t("dash.qs1")}</li>
            <li>{t("dash.qs2")}</li>
            <li>{t("dash.qs3")}</li>
            <li>{t("dash.qs4")}</li>
          </ol>
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 font-semibold">{t("dash.recentQuiz")}</h2>
          {stats.recentQuiz.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("dash.noQuiz")}</p>
          ) : (
            <ul className="space-y-2 text-sm">
              {stats.recentQuiz.map((q, i) => (
                <li key={i} className="flex justify-between">
                  <span className="text-muted-foreground">
                    {new Date(q.createdAt).toLocaleDateString(dateLocale)}
                  </span>
                  <span className="font-semibold">
                    {q.score}/{q.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}
