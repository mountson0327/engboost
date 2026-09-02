import { prisma } from "@/lib/db";
import { getCurrentUserId } from "@/lib/user";
import { handle, ok, notFound } from "@/lib/api";
import { cardUpdateSchema } from "@/lib/validation/schemas";

async function findOwnedCard(id: string, userId: string) {
  return prisma.card.findFirst({
    where: { id, deck: { userId } },
  });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const existing = await findOwnedCard(id, userId);
    if (!existing) return notFound("Không tìm thấy thẻ");

    const body = cardUpdateSchema.parse(await request.json());
    const card = await prisma.card.update({
      where: { id },
      data: {
        term: body.term ?? undefined,
        ipa: body.ipa ?? undefined,
        pos: body.pos ?? undefined,
        meaningEn: body.meaningEn ?? undefined,
        meaningVi: body.meaningVi ?? undefined,
        examples: body.examples ?? undefined,
      },
    });
    return ok(card);
  });
}

export async function DELETE(
  _req: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  return handle(async () => {
    const userId = await getCurrentUserId();
    const { id } = await ctx.params;
    const existing = await findOwnedCard(id, userId);
    if (!existing) return notFound("Không tìm thấy thẻ");
    await prisma.card.delete({ where: { id } });
    return ok({ deleted: true });
  });
}
