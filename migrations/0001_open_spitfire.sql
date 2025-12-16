ALTER TABLE "users" DROP CONSTRAINT "users_firebase_uid_unique";--> statement-breakpoint
DROP INDEX "users_firebase_idx";--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "firebase_uid";