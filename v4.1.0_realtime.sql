-- ============================================================
-- Your Library v4.1.0 — enable Realtime for direct messaging
-- The client subscribes to postgres_changes on messages and
-- conversations; without these publications the subscriptions
-- connect but never receive events. Idempotent.
-- (These lines existed commented-out at the bottom of
--  v2.0.0_phase2_messaging_schema.sql and may never have been run.)
-- ============================================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
    END IF;
END $$;
