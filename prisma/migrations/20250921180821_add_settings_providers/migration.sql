-- AlterTable
ALTER TABLE "public"."Settings" ADD COLUMN     "eleven_female_voice" TEXT,
ADD COLUMN     "eleven_male_voice" TEXT,
ADD COLUMN     "sttProvider" TEXT NOT NULL DEFAULT 'deepgram',
ADD COLUMN     "ttsProvider" TEXT NOT NULL DEFAULT 'plivo';
