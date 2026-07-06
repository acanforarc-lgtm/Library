-- ============================================================
-- Your Library v4.1.0 — Core schema (RECONSTRUCTED)
-- The books/shelves/book_cache/rooms tables predate the repo's
-- migration files. This DDL is reconstructed from application code
-- so the project can be recreated from the repo. Every statement is
-- guarded: running it against the existing live DB is a no-op.
-- After running, compare against the live schema (Database → Tables)
-- and reconcile any drift back into this file.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.books (
    id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       text NOT NULL,
    author      text,
    cover       text,
    color       text,
    isbn        text,
    shelf_id    uuid,
    board_index integer,
    position    numeric,
    "userData"  jsonb,
    created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.shelves (
    id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    name             text NOT NULL,
    wood_type        text DEFAULT 'oak',
    board_count      integer DEFAULT 3,
    background_color text DEFAULT '#8b7355',
    max_books        integer DEFAULT 20,
    is_public        boolean DEFAULT true,
    created_at       timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.book_cache (
    isbn         text PRIMARY KEY,
    title        text,
    author       text,
    cover_url    text,
    publish_year text,
    publisher    text,
    page_count   integer,
    description  text,
    rating       numeric,
    created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.rooms (
    user_id    uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    room_state jsonb,
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_books_user_id    ON public.books(user_id);
CREATE INDEX IF NOT EXISTS idx_books_shelf_id   ON public.books(shelf_id);
CREATE INDEX IF NOT EXISTS idx_shelves_user_id  ON public.shelves(user_id);

ALTER TABLE public.books      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shelves    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.book_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms      ENABLE ROW LEVEL SECURITY;

-- Policies (create only if absent — CREATE POLICY has no IF NOT EXISTS).
-- books/shelves visibility policies match v2.5.3_public_shelf_rls.sql.
-- Requires public.is_user_public() and public.are_friends() from that file.
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='books' AND policyname='books_select') THEN
        CREATE POLICY "books_select" ON public.books FOR SELECT
            USING (auth.uid() = user_id OR public.is_user_public(user_id) OR public.are_friends(auth.uid(), user_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='books' AND policyname='books_insert') THEN
        CREATE POLICY "books_insert" ON public.books FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='books' AND policyname='books_update') THEN
        CREATE POLICY "books_update" ON public.books FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='books' AND policyname='books_delete') THEN
        CREATE POLICY "books_delete" ON public.books FOR DELETE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shelves' AND policyname='shelves_select') THEN
        CREATE POLICY "shelves_select" ON public.shelves FOR SELECT
            USING (auth.uid() = user_id OR (public.is_user_public(user_id) AND is_public IS NOT FALSE) OR public.are_friends(auth.uid(), user_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shelves' AND policyname='shelves_insert') THEN
        CREATE POLICY "shelves_insert" ON public.shelves FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shelves' AND policyname='shelves_update') THEN
        CREATE POLICY "shelves_update" ON public.shelves FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='shelves' AND policyname='shelves_delete') THEN
        CREATE POLICY "shelves_delete" ON public.shelves FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- book_cache: shared metadata cache — any signed-in user may read/write
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='book_cache' AND policyname='book_cache_select') THEN
        CREATE POLICY "book_cache_select" ON public.book_cache FOR SELECT TO authenticated USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='book_cache' AND policyname='book_cache_insert') THEN
        CREATE POLICY "book_cache_insert" ON public.book_cache FOR INSERT TO authenticated WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='book_cache' AND policyname='book_cache_update') THEN
        CREATE POLICY "book_cache_update" ON public.book_cache FOR UPDATE TO authenticated USING (true);
    END IF;

    -- rooms: owner writes; readable by owner, public profiles, and accepted friends
    -- (the friend/public read unblocks the future "view a friend's room" feature)
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rooms' AND policyname='rooms_select') THEN
        CREATE POLICY "rooms_select" ON public.rooms FOR SELECT
            USING (auth.uid() = user_id OR public.is_user_public(user_id) OR public.are_friends(auth.uid(), user_id));
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rooms' AND policyname='rooms_insert') THEN
        CREATE POLICY "rooms_insert" ON public.rooms FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='rooms' AND policyname='rooms_update') THEN
        CREATE POLICY "rooms_update" ON public.rooms FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
