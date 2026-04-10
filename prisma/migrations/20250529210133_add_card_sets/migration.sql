-- CreateTable
CREATE TABLE "card_sets" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "is_demo" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "basis_amount" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "card_sets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "set_cards" (
    "id" TEXT NOT NULL,
    "set_id" TEXT NOT NULL,
    "token_id" TEXT NOT NULL,
    "symbol" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "basis_price" DOUBLE PRECISION,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "position" INTEGER NOT NULL DEFAULT 0,
    "added_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "set_cards_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "card_sets_user_id_idx" ON "card_sets"("user_id");

-- CreateIndex
CREATE INDEX "card_sets_user_id_is_active_idx" ON "card_sets"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "card_sets_is_demo_idx" ON "card_sets"("is_demo");

-- CreateIndex
CREATE INDEX "set_cards_set_id_idx" ON "set_cards"("set_id");

-- CreateIndex
CREATE INDEX "set_cards_token_id_idx" ON "set_cards"("token_id");

-- AddForeignKey
ALTER TABLE "card_sets" ADD CONSTRAINT "card_sets_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "set_cards" ADD CONSTRAINT "set_cards_set_id_fkey" FOREIGN KEY ("set_id") REFERENCES "card_sets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
