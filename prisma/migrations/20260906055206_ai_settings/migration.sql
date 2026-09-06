-- CreateTable
CREATE TABLE "AiSetting" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "provider" TEXT NOT NULL DEFAULT 'anthropic',
    "model" TEXT,
    "anthropicKey" TEXT,
    "openaiKey" TEXT,
    "geminiKey" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AiSetting_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AiSetting_userId_key" ON "AiSetting"("userId");

-- AddForeignKey
ALTER TABLE "AiSetting" ADD CONSTRAINT "AiSetting_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
