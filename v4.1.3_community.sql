-- ============================================================
-- Your Library v4.1.3 — Community (Groups) enablement
-- Run in the Supabase SQL editor AFTER the v2.2.1 group schema.
-- Idempotent and safe to re-run.
--
-- Makes the (previously hidden) Groups/community feature work in
-- production:
--   1. Denormalized display names on messages + members, so the
--      client never needs to read other users' profiles (PostgREST
--      cannot embed auth.users, and user_profiles RLS would hide
--      non-friends).
--   2. Names are stamped SERVER-SIDE by triggers from the real
--      user_profiles row — a client CANNOT forge sender_name/user_name
--      to impersonate someone (defense against display-name spoofing).
--   3. Realtime enabled for the group tables so chat is live.
--
-- Security note: this deliberately does NOT widen user_profiles RLS.
-- Only the chosen display name is copied into the group row.
-- ============================================================

SET lock_timeout = '5s';

-- 1. Denormalized name columns ------------------------------------------------
ALTER TABLE public.group_chat_messages ADD COLUMN IF NOT EXISTS sender_name text;
ALTER TABLE public.group_members       ADD COLUMN IF NOT EXISTS user_name   text;

-- 2. Server-authoritative name stamping (anti-spoofing) -----------------------
-- SECURITY DEFINER so the stamp works even when the inserting user cannot
-- read the target profile under RLS (e.g. an admin adding a private user).
-- These OVERWRITE any client-supplied value, so a forged name is impossible.

CREATE OR REPLACE FUNCTION public.stamp_group_message_sender()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT COALESCE(display_name, username) INTO NEW.sender_name
  FROM user_profiles WHERE id = NEW.sender_id;
  IF NEW.sender_name IS NULL OR NEW.sender_name = '' THEN
    NEW.sender_name := 'User';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_msg_sender ON public.group_chat_messages;
CREATE TRIGGER trg_stamp_msg_sender
  BEFORE INSERT ON public.group_chat_messages
  FOR EACH ROW EXECUTE FUNCTION public.stamp_group_message_sender();

CREATE OR REPLACE FUNCTION public.stamp_group_member_name()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  SELECT COALESCE(display_name, username) INTO NEW.user_name
  FROM user_profiles WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_stamp_member_name ON public.group_members;
CREATE TRIGGER trg_stamp_member_name
  BEFORE INSERT ON public.group_members
  FOR EACH ROW EXECUTE FUNCTION public.stamp_group_member_name();

-- 3. Realtime for the group tables -------------------------------------------
-- Live chat + live member/roster updates. Guarded against double-add.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='group_chat_messages') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chat_messages;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='group_members') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_members;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename='group_chats') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.group_chats;
  END IF;
END $$;

-- Verify (optional):
-- SELECT column_name FROM information_schema.columns
--   WHERE table_name='group_chat_messages' AND column_name='sender_name';
-- SELECT tgname FROM pg_trigger WHERE tgname LIKE 'trg_stamp%';
-- SELECT tablename FROM pg_publication_tables
--   WHERE pubname='supabase_realtime' AND tablename LIKE 'group%';
