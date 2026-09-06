import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok } from "@/lib/api";
import { writingSchema } from "@/lib/validation/schemas";
import { reviewParagraph } from "@/lib/ai/claude";

// POST /api/writing { topic, text } -> AI-review the paragraph, save it.
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { topic, text } = writingSchema.parse(await request.json());

    const review = await reviewParagraph(topic, text);

    const saved = await prisma.paragraphWriting.create({
      data: {
        userId,
        topic,
        text,
        corrected: review.corrected,
        feedback: review.feedback,
        improvements: review.improvements,
        score: review.score,
        cefr: review.cefr,
      },
    });

    return ok({ ...saved, source: review.source });
  });
}

// GET /api/writing -> recent writings (history)
export async function GET() {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const rows = await prisma.paragraphWriting.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return ok(rows);
  });
}
