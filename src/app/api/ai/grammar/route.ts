import { handle, ok } from "@/lib/api";
import { grammarSchema } from "@/lib/validation/schemas";
import { correctGrammar } from "@/lib/ai/claude";

// POST /api/ai/grammar { text } -> corrected sentence + explanation
export async function POST(request: Request) {
  return handle(async () => {
    const { text } = grammarSchema.parse(await request.json());
    const result = await correctGrammar(text);
    return ok(result);
  });
}
