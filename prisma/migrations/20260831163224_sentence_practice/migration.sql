-- CreateTable
CREATE TABLE "SentencePractice" (
    "id" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sentence" TEXT NOT NULL,
    "corrected" TEXT,
    "explanation" TEXT,
    "usage" TEXT,
    "natural" TEXT,
    "score" INTEGER,
    "cefr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SentencePractice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SentencePractice_cardId_idx" ON "SentencePractice"("cardId");

-- CreateIndex
CREATE INDEX "SentencePractice_userId_idx" ON "SentencePractice"("userId");

-- AddForeignKey
ALTER TABLE "SentencePractice" ADD CONSTRAINT "SentencePractice_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "Card"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SentencePractice" ADD CONSTRAINT "SentencePractice_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
