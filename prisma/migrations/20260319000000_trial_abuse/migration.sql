CREATE TABLE IF NOT EXISTS "user_registration_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "normalized_email" VARCHAR(255) NOT NULL,
    "ip_address" VARCHAR(64),
    "user_agent" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_registration_events_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "trial_abuse_suspects" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "email" VARCHAR(255) NOT NULL,
    "normalized_email" VARCHAR(255),
    "ip_address" VARCHAR(64),
    "reason_code" VARCHAR(64) NOT NULL,
    "reason_detail" TEXT NOT NULL,
    "status" VARCHAR(32) NOT NULL DEFAULT 'pending',
    "related_user_ids" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(6),
    CONSTRAINT "trial_abuse_suspects_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_registration_events_normalized_email_idx"
ON "user_registration_events"("normalized_email");

CREATE INDEX IF NOT EXISTS "user_registration_events_ip_address_idx"
ON "user_registration_events"("ip_address");

CREATE INDEX IF NOT EXISTS "user_registration_events_user_id_idx"
ON "user_registration_events"("user_id");

CREATE INDEX IF NOT EXISTS "user_registration_events_created_at_idx"
ON "user_registration_events"("created_at");

CREATE INDEX IF NOT EXISTS "trial_abuse_suspects_status_idx"
ON "trial_abuse_suspects"("status");

CREATE INDEX IF NOT EXISTS "trial_abuse_suspects_normalized_email_idx"
ON "trial_abuse_suspects"("normalized_email");

CREATE INDEX IF NOT EXISTS "trial_abuse_suspects_ip_address_idx"
ON "trial_abuse_suspects"("ip_address");

CREATE INDEX IF NOT EXISTS "trial_abuse_suspects_created_at_idx"
ON "trial_abuse_suspects"("created_at");

ALTER TABLE "user_registration_events"
ADD CONSTRAINT "user_registration_events_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "trial_abuse_suspects"
ADD CONSTRAINT "trial_abuse_suspects_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
