import { handle, ok } from "@/lib/api";
import { generateCardSchema } from "@/lib/validation/schemas";
import { generateCard } from "@/lib/ai/claude";

// POST /api/ai/generate-card { term } -> AI-suggested card fields (not saved yet)
export async function POST(request: Request) {
  return handle(async () => {
    const { term } = generateCardSchema.parse(await request.json());
    const card = await generateCard(term);
    return ok(card);
  });
}
