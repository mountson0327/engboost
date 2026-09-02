import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEMO_USER_EMAIL = "me@engboost.local";

const STARTER_CARDS = [
  {
    term: "improve",
    ipa: "/ɪmˈpruːv/",
    pos: "verb",
    meaningEn: "to make or become better",
    meaningVi: "cải thiện, làm cho tốt hơn",
    examples: ["I want to improve my English.", "The weather improved later."],
  },
  {
    term: "vocabulary",
    ipa: "/vəˈkæbjələri/",
    pos: "noun",
    meaningEn: "all the words a person knows or uses",
    meaningVi: "vốn từ vựng",
    examples: ["Reading grows your vocabulary."],
  },
  {
    term: "fluent",
    ipa: "/ˈfluːənt/",
    pos: "adjective",
    meaningEn: "able to speak a language easily and well",
    meaningVi: "trôi chảy, lưu loát",
    examples: ["She is fluent in three languages."],
  },
  {
    term: "review",
    ipa: "/rɪˈvjuː/",
    pos: "verb",
    meaningEn: "to study something again",
    meaningVi: "ôn tập, xem lại",
    examples: ["Review your cards every day."],
  },
  {
    term: "confident",
    ipa: "/ˈkɒnfɪdənt/",
    pos: "adjective",
    meaningEn: "feeling sure about your ability",
    meaningVi: "tự tin",
    examples: ["Practice makes you more confident."],
  },
  {
    term: "practice",
    ipa: "/ˈpræktɪs/",
    pos: "noun",
    meaningEn: "repeated action to improve a skill",
    meaningVi: "sự luyện tập",
    examples: ["Daily practice is the key."],
  },
];

async function main() {
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: { email: DEMO_USER_EMAIL, name: "Me" },
  });

  const existing = await prisma.deck.findFirst({
    where: { userId: user.id, name: "Bắt đầu — Từ cơ bản" },
  });
  if (existing) {
    console.log("Seed: deck already exists, skipping.");
    return;
  }

  const deck = await prisma.deck.create({
    data: {
      userId: user.id,
      name: "Bắt đầu — Từ cơ bản",
      description: "Bộ từ mẫu để bạn thử ôn tập và làm quiz ngay.",
    },
  });

  await prisma.card.createMany({
    data: STARTER_CARDS.map((c) => ({ ...c, deckId: deck.id })),
  });

  console.log(`Seed done: user=${user.email}, deck="${deck.name}" with ${STARTER_CARDS.length} cards.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
