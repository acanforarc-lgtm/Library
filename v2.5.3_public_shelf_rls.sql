-- ============================================================
-- Your Library v2.5.3 — Public Bookshelf RLS Fix
-- Run this in your Supabase SQL Editor
-- ============================================================
--
-- Problem: books and shelves tables use owner-only RLS, so when
-- user A views user B's public profile the Supabase queries at
-- openUserProfile() return empty arrays — the profile appears
-- blank even though canView is true in the JS.
--
-- Fix: two SECURITY DEFINER helpers (sidestep RLS recursion when
-- checking user_profiles from inside books/shelves policies, same
-- approach as v2.2.1 group-chat fix), then split SELECT from the
-- write policies so public viewing is allowed without relaxing writes.
-- ============================================================

-- ── Helper: is this user's profile set to public? ─────────────────────────
-- SECURITY DEFINER means it reads user_profiles as the function owner
-- (postgres), not as the calling user, avoiding any RLS recursion.
CREATE OR REPLACE FUNCTION public.is_user_public(uid uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT
    CASE
      WHEN visibility IS NOT NULL THEN visibility = 'public'
      WHEN is_public  IS NOT NULL THEN is_public
      ELSE true
    END
  FROM user_profiles
  WHERE id = uid
  LIMIT 1;
$$;

-- ── Helper: do these two users have an accepted follow relationship? ───────
CREATE OR REPLACE FUNCTION public.are_friends(viewer uuid, target uuid)
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM friendships
    WHERE status = 'accepted'
    AND (
      (user_id = viewer AND friend_id = target)
      OR (user_id = target AND friend_id = viewer)
    )
  );
$$;


-- ══════════════════════════════════════════════════════════════
-- books table
-- ══════════════════════════════════════════════════════════════

-- Drop common variants of the old owner-only SELECT / FOR ALL policies.
-- IF EXISTS makes each DROP safe even if the name doesn't match.
DROP POLICY IF EXISTS "Users can only access their own books" ON books;
DROP POLICY IF EXISTS "Users can view their own books"        ON books;
DROP POLICY IF EXISTS "Enable read access for all users"      ON books;
DROP POLICY IF EXISTS "books_select"                          ON books;

-- SELECT: own books, OR books from a public profile, OR books from someone
-- the viewer is an accepted follower of (private-but-following).
CREATE POLICY "books_select"
  ON books FOR SELECT
  USING (
    auth.uid() = user_id
    OR public.is_user_public(user_id)
    OR public.are_friends(auth.uid(), user_id)
  );

-- Re-declare write policies explicitly (in case the original was FOR ALL,
-- dropping it would have removed insert/update/delete coverage too).
DROP POLICY IF EXISTS "Users can insert their own books" ON books;
DROP POLICY IF EXISTS "Users can update their own books" ON books;
DROP POLICY IF EXISTS "Users can delete their own books" ON books;
DROP POLICY IF EXISTS "books_insert"                     ON books;
DROP POLICY IF EXISTS "books_update"                     ON books;
DROP POLICY IF EXISTS "books_delete"                     ON books;

CREATE POLICY "books_insert"
  ON books FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "books_update"
  ON books FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "books_delete"
  ON books FOR DELETE
  USING (auth.uid() = user_id);


-- ══════════════════════════════════════════════════════════════
-- shelves table
-- ══════════════════════════════════════════════════════════════

DROP POLICY IF EXISTS "Users can only access their own shelves" ON shelves;
DROP POLICY IF EXISTS "Users can view their own shelves"        ON shelves;
DROP POLICY IF EXISTS "Enable read access for all users"        ON shelves;
DROP POLICY IF EXISTS "shelves_select"                          ON shelves;

-- SELECT: own shelves, OR a public shelf on a public profile, OR any shelf
-- from someone the viewer follows (private profiles grant full shelf access
-- once the follow is accepted — matches the JS filter at openUserProfile).
CREATE POLICY "shelves_select"
  ON shelves FOR SELECT
  USING (
    auth.uid() = user_id
    OR (public.is_user_public(user_id) AND is_public IS NOT FALSE)
    OR public.are_friends(auth.uid(), user_id)
  );

DROP POLICY IF EXISTS "Users can insert their own shelves" ON shelves;
DROP POLICY IF EXISTS "Users can update their own shelves" ON shelves;
DROP POLICY IF EXISTS "Users can delete their own shelves" ON shelves;
DROP POLICY IF EXISTS "shelves_insert"                     ON shelves;
DROP POLICY IF EXISTS "shelves_update"                     ON shelves;
DROP POLICY IF EXISTS "shelves_delete"                     ON shelves;

CREATE POLICY "shelves_insert"
  ON shelves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shelves_update"
  ON shelves FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "shelves_delete"
  ON shelves FOR DELETE
  USING (auth.uid() = user_id);
