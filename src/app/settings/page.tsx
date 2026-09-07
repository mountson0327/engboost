"use client";

import { useEffect, useRef, useState } from "react";
import { SunIcon, MoonIcon, MonitorIcon } from "@animateicons/react/lucide";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/PasswordInput";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/provider";
import { LANGS, type Lang, type TKey } from "@/lib/i18n/dictionaries";
import {
  THEMES,
  applyTheme,
  readTheme,
  resolveDark,
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

const SECTIONS: { id: string; labelKey: TKey }[] = [
  { id: "appearance", labelKey: "settings.appearance" },
  { id: "review", labelKey: "settings.review" },
  { id: "ai", labelKey: "settings.ai" },
];

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
    <div className="scrollbar-hover inline-flex max-w-full gap-1 overflow-x-auto rounded-lg border px-1 py-2">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
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
    <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
      <div className="min-w-0">
        <div className="font-medium">{title}</div>
        {hint && <div className="text-sm text-muted-foreground">{hint}</div>}
      </div>
      <div className="min-w-0">{children}</div>
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
    const th = readTheme();
    // "system" is no longer offered — migrate old cookies to a concrete choice.
    if (th === "system") {
      const resolved = resolveDark("system") ? "dark" : "light";
      applyTheme(resolved);
      setThemeState(resolved);
    } else {
      setThemeState(th);
    }
    setReviewLimitState(getReviewLimit());
    setAutoSpeakState(getAutoSpeak());
    loadAi();
  }, []);

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

  // Scroll-spy: highlight the section currently in view.
  const [activeSection, setActiveSection] = useState("appearance");
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) setActiveSection(e.target.id);
        });
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: 0 },
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  function scrollTo(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  // Sliding underline indicator for the section nav.
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [indicator, setIndicator] = useState({ x: 0, y: 0, w: 0 });
  useEffect(() => {
    const el = itemRefs.current[activeSection];
    if (el)
      setIndicator({
        x: el.offsetLeft,
        y: el.offsetTop + el.offsetHeight - 2,
        w: el.offsetWidth,
      });
  }, [activeSection, lang]);

  return (
    <div className="mx-auto flex max-w-4xl gap-8">
      {/* Sticky section nav (scroll-spy) */}
      <aside className="hidden w-48 shrink-0 md:block">
        <nav className="sticky top-20">
          <div className="relative">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                ref={(el) => {
                  itemRefs.current[s.id] = el;
                }}
                onClick={() => scrollTo(s.id)}
                className={cn(
                  "block w-fit px-1 py-2 text-left text-sm font-medium transition-colors duration-200",
                  activeSection === s.id
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {t(s.labelKey)}
              </button>
            ))}
            {/* Sliding underline that follows the active section. */}
            <span
              aria-hidden
              className="pointer-events-none absolute left-0 top-0 h-0.5 rounded-full bg-primary transition-all duration-300 ease-out"
              style={{
                transform: `translate(${indicator.x}px, ${indicator.y}px)`,
                width: indicator.w,
              }}
            />
          </div>
        </nav>
      </aside>

      <div className="min-w-0 flex-1 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">{t("settings.title")}</h1>
          {saved && <span className="text-sm text-success">{saved}</span>}
        </div>

        {/* Appearance */}
        <section id="appearance" className="scroll-mt-24">
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
        </section>

        {/* Review */}
        <section id="review" className="scroll-mt-24">
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
        </section>

        {/* AI */}
        <section id="ai" className="scroll-mt-24">
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
            <div className="flex flex-wrap items-stretch gap-2">
              <PasswordInput
                autoComplete="off"
                value={keyInput}
                placeholder={t("settings.aiKeyPlaceholder")}
                onChange={(e) => setKeyInput(e.target.value)}
                className="min-w-0 max-w-sm flex-1"
                showLabel={t("auth.showPassword")}
                hideLabel={t("auth.hidePassword")}
              />
              <Button
                onClick={saveKey}
                disabled={savingKey || !keyInput.trim()}
                className="h-9 shrink-0 px-4"
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
        </section>
      </div>
    </div>
  );
}
