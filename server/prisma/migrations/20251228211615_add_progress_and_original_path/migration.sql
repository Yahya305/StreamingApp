-- AlterTable
ALTER TABLE "Video" ADD COLUMN     "originalPath" TEXT,
ADD COLUMN     "progress" INTEGER NOT NULL DEFAULT 0;
