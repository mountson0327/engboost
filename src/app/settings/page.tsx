"use client";

import { useEffect, useState } from "react";
import { SunIcon, MoonIcon, MonitorIcon } from "@animateicons/react/lucide";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LANGS, type Lang, type TKey } from "@/lib/i18n/dictionaries";
import {
  THEMES,
  applyTheme,
  readTheme,
  type Theme,
} from "@/lib/theme";
import {
  DEFAULT_REVIEW_LIMIT,
  getAutoSpeak,
  getReviewLimit,
  setAutoSpeak as saveAutoSpeak,
  setReviewLimit as saveReviewLimit,
} from "@/lib/prefs";

type AiProvider = "anthropic" | "openai" | "gemini";
type KeyInfo = { set: boolean; hint: string };
const AI_PROVIDERS: AiProvider[] = ["anthropic", "openai", "gemini"];
const MODEL_SUGGEST: Record<AiProvider, string> = {
  anthropic: "claude-opus-5, claude-sonnet-5, claude-haiku-4-5",
  openai: "gpt-4o, gpt-4o-mini, gpt-4.1-mini",
  gemini: "gemini-2.0-flash, gemini-1.5-pro",
};

function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string; icon?: React.ReactNode }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg border p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.icon}
          {o.label}
        </button>
      ))}
    </div>
  );
}

function Row({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 py-3">
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        {hint && <div className="text-sm text-muted-foreground">{hint}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

export default function SettingsPage() {
  const { t, lang, setLang } = useI18n();

  const [theme, setThemeState] = useState<Theme>("system");
  const [reviewLimit, setReviewLimitState] = useState(DEFAULT_REVIEW_LIMIT);
  const [autoSpeak, setAutoSpeakState] = useState(false);
  const [saved, setSaved] = useState("");

  // AI provider config
  const [aiProvider, setAiProvider] = useState<AiProvider>("anthropic");
  const [aiModel, setAiModel] = useState("");
  const [aiKeys, setAiKeys] = useState<Record<AiProvider, KeyInfo>>({
    anthropic: { set: false, hint: "" },
    openai: { set: false, hint: "" },
    gemini: { set: false, hint: "" },
  });
  const [keyInput, setKeyInput] = useState("");
  const [savingKey, setSavingKey] = useState(false);

  async function loadAi() {
    try {
      const r = await fetch("/api/settings/ai");
      const d = await r.json();
      setAiProvider(d.provider);
      setAiModel(d.model ?? "");
      setAiKeys(d.keys);
    } catch {
      /* ignore */
    }
  }

  // Load client-side values after mount (avoids hydration mismatch).
  useEffect(() => {
    setThemeState(readTheme());
    setReviewLimitState(getReviewLimit());
    setAutoSpeakState(getAutoSpeak());
    loadAi();
  }, []);

  // Keep "system" theme in sync when the OS scheme changes.
  useEffect(() => {
    if (theme !== "system" || typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  function flashSaved() {
    setSaved(t("settings.saved"));
    window.setTimeout(() => setSaved(""), 1500);
  }

  function changeTheme(next: Theme) {
    setThemeState(next);
    applyTheme(next);
    flashSaved();
  }

  function changeReviewLimit(n: number) {
    const v = Math.max(1, Math.min(200, Math.round(n) || DEFAULT_REVIEW_LIMIT));
    setReviewLimitState(v);
    saveReviewLimit(v);
    flashSaved();
  }

  function toggleAutoSpeak() {
    const v = !autoSpeak;
    setAutoSpeakState(v);
    saveAutoSpeak(v);
    flashSaved();
  }

  async function patchAi(body: Record<string, string>) {
    await fetch("/api/settings/ai", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    flashSaved();
  }

  async function changeProvider(p: AiProvider) {
    setAiProvider(p);
    setAiModel("");
    setKeyInput("");
    // Reset model so it defaults to the new provider's model (not the old one).
    await patchAi({ provider: p, model: "" });
    loadAi();
  }

  async function changeModel(m: string) {
    setAiModel(m);
    await patchAi({ provider: aiProvider, model: m });
  }

  async function saveKey() {
    if (!keyInput.trim()) return;
    setSavingKey(true);
    try {
      await patchAi({ provider: aiProvider, apiKey: keyInput.trim() });
      setKeyInput("");
      await loadAi();
    } finally {
      setSavingKey(false);
    }
  }

  const themeIcon: Record<Theme, React.ReactNode> = {
    light: <SunIcon size={16} />,
    dark: <MoonIcon size={16} />,
    system: <MonitorIcon size={16} />,
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
        {saved && <span className="text-sm text-success">{saved}</span>}
      </div>

      {/* Appearance */}
      <Card className="p-5">
        <h2 className="font-semibold">{t("settings.appearance")}</h2>
        <div className="divide-y">
          <Row title={t("settings.theme")}>
            <Segmented<Theme>
              value={theme}
              onChange={changeTheme}
              options={THEMES.map((th) => ({
                value: th,
                label: t(`settings.theme.${th}` as TKey),
                icon: themeIcon[th],
              }))}
            />
          </Row>
          <Row title={t("settings.language")}>
            <Segmented<Lang>
              value={lang}
              onChange={(l) => {
                setLang(l);
                flashSaved();
              }}
              options={LANGS.map((l) => ({ value: l, label: l.toUpperCase() }))}
            />
          </Row>
        </div>
      </Card>

      {/* Review */}
      <Card className="p-5">
        <h2 className="font-semibold">{t("settings.review")}</h2>
        <div className="divide-y">
          <Row
            title={t("settings.reviewLimit")}
            hint={t("settings.reviewLimitHint")}
          >
            <Input
              type="number"
              min={1}
              max={200}
              value={reviewLimit}
              onChange={(e) => changeReviewLimit(Number(e.target.value))}
              className="w-24"
            />
          </Row>
          <Row
            title={t("settings.autoSpeak")}
            hint={t("settings.autoSpeakHint")}
          >
            <button
              role="switch"
              aria-checked={autoSpeak}
              onClick={toggleAutoSpeak}
              className={cn(
                "relative h-6 w-11 rounded-full transition-colors",
                autoSpeak ? "bg-primary" : "bg-border",
              )}
            >
              <span
                className={cn(
                  "absolute top-0.5 size-5 rounded-full bg-white transition-transform",
                  autoSpeak ? "translate-x-5" : "translate-x-0.5",
                )}
              />
            </button>
          </Row>
        </div>
      </Card>

      {/* AI */}
      <Card className="p-5">
        <h2 className="font-semibold">{t("settings.ai")}</h2>
        <div className="divide-y">
          <Row title={t("settings.aiProvider")}>
            <Segmented<AiProvider>
              value={aiProvider}
              onChange={changeProvider}
              options={AI_PROVIDERS.map((p) => ({
                value: p,
                label: t(`settings.provider.${p}` as TKey),
              }))}
            />
          </Row>

          <Row
            title={t("settings.aiModel")}
            hint={t("settings.aiModelHint", { models: MODEL_SUGGEST[aiProvider] })}
          >
            <Input
              value={aiModel}
              placeholder={MODEL_SUGGEST[aiProvider].split(",")[0].trim()}
              onChange={(e) => setAiModel(e.target.value)}
              onBlur={(e) => changeModel(e.target.value)}
              className="w-56"
            />
          </Row>

          <div className="space-y-2 py-3">
            <div className="font-medium">{t("settings.aiKey")}</div>
            <div className="text-sm text-muted-foreground">
              {aiKeys[aiProvider]?.set
                ? t("settings.aiKeySaved", { hint: aiKeys[aiProvider].hint })
                : t("settings.aiKeyNone")}
            </div>
            <div className="flex flex-wrap gap-2">
              <Input
                type="password"
                autoComplete="off"
                value={keyInput}
                placeholder={t("settings.aiKeyPlaceholder")}
                onChange={(e) => setKeyInput(e.target.value)}
                className="max-w-sm flex-1"
              />
              <Button
                onClick={saveKey}
                disabled={savingKey || !keyInput.trim()}
                className="h-9 px-4"
              >
                {t("common.save")}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              {t("settings.aiKeyNote")}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
