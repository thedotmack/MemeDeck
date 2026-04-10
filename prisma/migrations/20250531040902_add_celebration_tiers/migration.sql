-- AlterTable
ALTER TABLE "user_game_states" ADD COLUMN     "celebration_tiers" JSONB NOT NULL DEFAULT '{}';
