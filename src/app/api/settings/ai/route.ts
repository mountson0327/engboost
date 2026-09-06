import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok } from "@/lib/api";
import { aiSettingsSchema } from "@/lib/validation/schemas";
import { DEFAULT_MODELS, type Provider } from "@/lib/ai/config";

type KeyInfo = { set: boolean; hint: string };

function mask(dbKey: string | null | undefined, envKey?: string): KeyInfo {
  if (dbKey) return { set: true, hint: "…" + dbKey.slice(-4) };
  if (envKey) return { set: true, hint: "(.env)" };
  return { set: false, hint: "" };
}

// GET /api/settings/ai -> current provider/model + masked key status (never full keys)
export async function GET() {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const s = await prisma.aiSetting.findUnique({ where: { userId } });
    const provider = (s?.provider as Provider) ?? "anthropic";
    return ok({
      provider,
      model: s?.model ?? "",
      defaultModels: DEFAULT_MODELS,
      keys: {
        anthropic: mask(s?.anthropicKey, process.env.ANTHROPIC_API_KEY),
        openai: mask(s?.openaiKey, process.env.OPENAI_API_KEY),
        gemini: mask(s?.geminiKey, process.env.GEMINI_API_KEY),
      },
    });
  });
}

// PATCH /api/settings/ai { provider?, model?, apiKey? }
// apiKey (if non-empty) is saved for `provider`. Keys are never echoed back.
export async function PATCH(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const body = aiSettingsSchema.parse(await request.json());
    const existing = await prisma.aiSetting.findUnique({ where: { userId } });

    const data: Record<string, string | null> = {};
    if (body.provider) data.provider = body.provider;
    if (body.model !== undefined) data.model = body.model.trim() || null;

    const key = body.apiKey?.trim();
    if (key) {
      const p = body.provider ?? (existing?.provider as Provider) ?? "anthropic";
      if (p === "anthropic") data.anthropicKey = key;
      else if (p === "openai") data.openaiKey = key;
      else data.geminiKey = key;
    }

    await prisma.aiSetting.upsert({
      where: { userId },
      create: { userId, ...data },
      update: data,
    });
    return ok({ ok: true });
  });
}
