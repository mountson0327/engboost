-- CreateTable
CREATE TABLE "ParagraphWriting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topic" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "corrected" TEXT,
    "feedback" TEXT,
    "improvements" TEXT,
    "score" INTEGER,
    "cefr" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ParagraphWriting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ParagraphWriting_userId_idx" ON "ParagraphWriting"("userId");

-- AddForeignKey
ALTER TABLE "ParagraphWriting" ADD CONSTRAINT "ParagraphWriting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
