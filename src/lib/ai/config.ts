import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";

export type Provider = "anthropic" | "openai" | "gemini";
export const PROVIDERS: Provider[] = ["anthropic", "openai", "gemini"];

// Sensible default model per provider (user can override in Settings).
export const DEFAULT_MODELS: Record<Provider, string> = {
  anthropic: "claude-sonnet-5",
  openai: "gpt-4o-mini",
  gemini: "gemini-2.5-flash-lite",
};

export function isProvider(v: unknown): v is Provider {
  return v === "anthropic" || v === "openai" || v === "gemini";
}

export type AiConfig = {
  provider: Provider;
  model: string;
  apiKey: string;
  hasKey: boolean;
};

/** Resolve the active AI provider/model/key for the current user. */
export async function getAiConfig(): Promise<AiConfig> {
  const userId = await getCurrentUserId();
  const s = await prisma.aiSetting.findUnique({ where: { userId } });

  const provider: Provider = isProvider(s?.provider) ? s.provider : "anthropic";
  const model = s?.model?.trim() || DEFAULT_MODELS[provider];

  // DB key wins; fall back to env var (keeps existing ANTHROPIC_API_KEY working).
  const dbKey =
    provider === "anthropic"
      ? s?.anthropicKey
      : provider === "openai"
        ? s?.openaiKey
        : s?.geminiKey;
  const envKey =
    provider === "anthropic"
      ? process.env.ANTHROPIC_API_KEY
      : provider === "openai"
        ? process.env.OPENAI_API_KEY
        : process.env.GEMINI_API_KEY;

  const apiKey = (dbKey || envKey || "").trim();
  return { provider, model, apiKey, hasKey: Boolean(apiKey) };
}

export async function hasActiveAiKey(): Promise<boolean> {
  return (await getAiConfig()).hasKey;
}
