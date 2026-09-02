import { handle, ok } from "@/lib/api";
import { readingGenerateSchema } from "@/lib/validation/schemas";
import { generateReading } from "@/lib/ai/claude";

// POST /api/ai/reading { topic, level? } -> a short reading passage
export async function POST(request: Request) {
  return handle(async () => {
    const { topic, level = "B1" } = readingGenerateSchema.parse(
      await request.json(),
    );
    const passage = await generateReading(topic, level);
    return ok(passage);
  });
}
