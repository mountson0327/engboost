import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok } from "@/lib/api";
import { chatSchema } from "@/lib/validation/schemas";
import { chatReply, type ChatTurn } from "@/lib/ai/claude";

// POST /api/ai/chat { topic, sessionId, message }
// Persists the turn, asks Claude (or fallback) for a reply, persists it too.
export async function POST(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { topic, sessionId, message } = chatSchema.parse(
      await request.json(),
    );

    await prisma.chatMessage.create({
      data: { userId, sessionId, role: "user", content: message },
    });

    const priorRows = await prisma.chatMessage.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: "asc" },
      take: 20,
    });
    const history: ChatTurn[] = priorRows.map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    }));

    const { reply, source } = await chatReply(topic, history);

    await prisma.chatMessage.create({
      data: { userId, sessionId, role: "assistant", content: reply },
    });

    return ok({ reply, source });
  });
}

// GET /api/ai/chat?sessionId= -> message history
export async function GET(request: Request) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const sessionId = new URL(request.url).searchParams.get("sessionId");
    if (!sessionId) return ok([]);
    const rows = await prisma.chatMessage.findMany({
      where: { userId, sessionId },
      orderBy: { createdAt: "asc" },
    });
    return ok(rows);
  });
}
