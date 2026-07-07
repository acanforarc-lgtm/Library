-- ============================================================
-- Your Library v4.1.1 — Security Hardening (RLS fixes)
-- Run this in your Supabase SQL Editor AFTER the v4.1.0 files.
-- Every statement is idempotent and safe to re-run.
--
-- Fixes three concrete authorization gaps found in the
-- 2026-07-06 security review (see vault: Security Review.md):
--   1. [HIGH] friendships self-accept → private-library access bypass
--   2. [MED]  notifications spoofing → forged "system" messages
--   3. [MED]  ai_moderation_log exposed via the public anon key
-- ============================================================


-- ────────────────────────────────────────────────────────────
-- 1. [HIGH] Friendships — stop the requester from self-accepting
-- ────────────────────────────────────────────────────────────
-- A friend request row is always {user_id = requester, friend_id = target}
-- (the INSERT policy pins auth.uid() = user_id, and the app sets
-- requested_by = user_id). The old UPDATE policy let EITHER party set
-- status, so the requester could flip their own outgoing request to
-- 'accepted' and — via are_friends() — read the target's private books,
-- shelves, and room without the target ever approving.
--
-- Fix: only the recipient (friend_id) may move a row to 'accepted'.
-- Other status changes (e.g. 'blocked') stay open to both parties.

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='friendships' AND cmd='UPDATE'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.friendships', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "friendships_update_guarded"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = friend_id)
  WITH CHECK (status <> 'accepted' OR auth.uid() = friend_id);


-- ────────────────────────────────────────────────────────────
-- 2. [MED] Notifications — block forged "system" notifications
-- ────────────────────────────────────────────────────────────
-- The old INSERT policy only checked auth.role() = 'authenticated',
-- so any signed-in user could write a notification into anyone's feed
-- with type='system' and attacker-chosen title/content — a convincing
-- in-app phishing/impersonation primitive. (Not XSS: the client escapes
-- text and never navigates to action_url as a URL.)
--
-- Fix: keep cross-user inserts working (friend requests, recommendations,
-- message pings all legitimately notify other users) but forbid the
-- 'system' type from any client. Genuine system notifications must be
-- written with the service role (server-side), which bypasses RLS.
-- NOTE: residual — a user can still send NON-system notifications to any
-- user id. Closing that fully needs a server-side check (see
-- Security Review.md → "Residual / accepted risks").

DO $$
DECLARE pol RECORD;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='notifications' AND cmd='INSERT'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.notifications', pol.policyname);
  END LOOP;
END $$;

CREATE POLICY "notifications_insert_guarded"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL AND type <> 'system');


-- ────────────────────────────────────────────────────────────
-- 3. [MED] ai_moderation_log — was exposed through the anon key
-- ────────────────────────────────────────────────────────────
-- v2.2.1 created this table with the comment "No RLS — service role
-- only", but in Supabase a public-schema table with RLS DISABLED is
-- fully readable/writable through PostgREST by the anon key (which
-- ships in every client). Enabling RLS with NO policies denies all
-- client access — which is exactly the "service role only" intent
-- (the service role bypasses RLS). If group moderation is later wired
-- to write logs from the client, add a narrow INSERT policy then.

ALTER TABLE IF EXISTS public.ai_moderation_log ENABLE ROW LEVEL SECURITY;


-- ────────────────────────────────────────────────────────────
-- 4. [MED] book_cache poisoning — NOT changed here (documented risk)
-- ────────────────────────────────────────────────────────────
-- `book_cache` is a shared metadata cache any authenticated user can
-- upsert (v4.1.0_core_schema.sql). A malicious user can overwrite a
-- cached cover_url so every viewer of that ISBN loads an attacker URL
-- (IP/User-Agent/timing leak or offensive image), or vandalize titles.
-- It is intentionally left functional here because the import/cache
-- "fill blanks" flow depends on client upserts and cannot be verified
-- while the project is paused. Recommended future fix: move cache
-- writes behind a SECURITY DEFINER function that only fills NULL
-- columns and never overwrites an existing cover_url. Tracked in
-- Open Issues.md and Improvement Ideas.md.


-- ────────────────────────────────────────────────────────────
-- Verify (optional): list the resulting policies
-- ────────────────────────────────────────────────────────────
-- SELECT tablename, policyname, cmd FROM pg_policies
--   WHERE tablename IN ('friendships','notifications')
--   ORDER BY tablename, cmd;
-- SELECT relname, relrowsecurity FROM pg_class
--   WHERE relname = 'ai_moderation_log';
