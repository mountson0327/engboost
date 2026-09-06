import { ok } from "@/lib/api";
import { getAiConfig } from "@/lib/ai/config";

// GET /api/status -> active AI provider/model + whether a key is set.
export async function GET() {
  const cfg = await getAiConfig();
  return ok({ provider: cfg.provider, model: cfg.model, hasKey: cfg.hasKey });
}
