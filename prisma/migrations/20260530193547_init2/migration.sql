/*
  Warnings:

  - You are about to alter the column `email` on the `auth_users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(320)`.
  - You are about to alter the column `status` on the `auth_users` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(32)`.
  - You are about to drop the column `ip_adress` on the `refresh_sessions` table. All the data in the column will be lost.
  - Added the required column `ip_address` to the `refresh_sessions` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "password_reset_tokens_user_id_key";

-- DropIndex
DROP INDEX "refresh_sessions_ip_adress_key";

-- DropIndex
DROP INDEX "refresh_sessions_user_id_key";

-- AlterTable
ALTER TABLE "auth_users" ALTER COLUMN "email" SET DATA TYPE VARCHAR(320),
ALTER COLUMN "status" SET DEFAULT 'active',
ALTER COLUMN "status" SET DATA TYPE VARCHAR(32);

-- AlterTable
ALTER TABLE "password_reset_tokens" ALTER COLUMN "used_at" DROP NOT NULL;

-- AlterTable
ALTER TABLE "refresh_sessions" DROP COLUMN "ip_adress",
ADD COLUMN     "ip_address" VARCHAR(45) NOT NULL,
ALTER COLUMN "revoked_at" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "auth_users_email_idx" ON "auth_users"("email");

-- CreateIndex
CREATE INDEX "auth_users_role_idx" ON "auth_users"("role");

-- CreateIndex
CREATE INDEX "auth_users_status_idx" ON "auth_users"("status");

-- CreateIndex
CREATE INDEX "password_reset_tokens_user_id_idx" ON "password_reset_tokens"("user_id");

-- CreateIndex
CREATE INDEX "password_reset_tokens_token_hash_idx" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_used_at_idx" ON "password_reset_tokens"("used_at");

-- CreateIndex
CREATE INDEX "refresh_sessions_user_id_idx" ON "refresh_sessions"("user_id");

-- CreateIndex
CREATE INDEX "refresh_sessions_refresh_token_hash_idx" ON "refresh_sessions"("refresh_token_hash");

-- CreateIndex
CREATE INDEX "refresh_sessions_expires_at_idx" ON "refresh_sessions"("expires_at");

-- CreateIndex
CREATE INDEX "refresh_sessions_revoked_at_idx" ON "refresh_sessions"("revoked_at");

-- CreateIndex
CREATE INDEX "refresh_sessions_ip_address_idx" ON "refresh_sessions"("ip_address");
