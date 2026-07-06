-- ============================================================
-- Your Library v4.1.0 — imports audit table
-- Specified in Revision 3.0.0; the app inserts a row per import
-- run and silently skips when the table is missing. Creating it
-- turns import history back on. Idempotent.
-- ============================================================

CREATE TABLE IF NOT EXISTS public.imports (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    source     text,
    filename   text,
    total_rows integer,
    added      integer,
    updated    integer,
    skipped    integer,
    failed     integer,
    status     text,
    created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imports_user_id ON public.imports(user_id);

ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='imports' AND policyname='imports_select') THEN
        CREATE POLICY "imports_select" ON public.imports FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='imports' AND policyname='imports_insert') THEN
        CREATE POLICY "imports_insert" ON public.imports FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='imports' AND policyname='imports_update') THEN
        CREATE POLICY "imports_update" ON public.imports FOR UPDATE USING (auth.uid() = user_id);
    END IF;
END $$;
