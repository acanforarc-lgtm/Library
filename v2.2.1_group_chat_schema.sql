-- ============================================================
-- Your Library v2.2.1 — Group Chat Schema
-- Apply in Supabase SQL Editor (project: wqurkgnossvafujxlehq)
-- Run AFTER v2.0.0_social_schema.sql
-- ============================================================
-- Strategy: create ALL tables first, then add RLS policies
-- (policies that cross-reference tables must come after all
--  referenced tables exist).
-- ============================================================


-- ─────────────────────────────────────────────────────────────
-- TABLES (no cross-referencing policies yet)
-- ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS book_groups (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title            VARCHAR(100) NOT NULL,
  description      TEXT,
  type             VARCHAR(10)  NOT NULL CHECK (type IN ('private','public')),
  related_book_id  TEXT,
  related_shelf_id UUID,
  owner_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members      INTEGER NOT NULL DEFAULT 40
    CHECK (max_members >= 1 AND max_members <= 100),
  max_shelves      INTEGER NOT NULL DEFAULT 10
    CHECK (max_shelves >= 0 AND max_shelves <= 10),
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT private_max_members CHECK (type = 'public' OR max_members <= 40),
  CONSTRAINT public_max_members  CHECK (type = 'private' OR max_members <= 100)
);

CREATE INDEX IF NOT EXISTS idx_bg_owner ON book_groups(owner_id);
CREATE INDEX IF NOT EXISTS idx_bg_type  ON book_groups(type);
CREATE INDEX IF NOT EXISTS idx_bg_book  ON book_groups(related_book_id);

ALTER TABLE book_groups ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS group_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES book_groups(id) ON DELETE CASCADE,
  name       VARCHAR(50) NOT NULL,
  role_type  VARCHAR(20) NOT NULL
    CHECK (role_type IN ('admin','assistant_admin','manager','member','custom')),
  privileges JSONB NOT NULL DEFAULT '[]'::jsonb,
  sort_order INTEGER NOT NULL DEFAULT 99,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(group_id, name)
);

CREATE INDEX IF NOT EXISTS idx_gr_group ON group_roles(group_id);

ALTER TABLE group_roles ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS group_members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES book_groups(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role_id    UUID REFERENCES group_roles(id) ON DELETE SET NULL,
  joined_at  TIMESTAMPTZ DEFAULT NOW(),
  banned_at  TIMESTAMPTZ,
  ban_reason TEXT,
  banned_by  UUID REFERENCES auth.users(id),
  UNIQUE(group_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_gm_group ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_gm_user  ON group_members(user_id);

ALTER TABLE group_members ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS role_change_requests (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id          UUID NOT NULL REFERENCES book_groups(id) ON DELETE CASCADE,
  requested_by      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_role_id UUID NOT NULL REFERENCES group_roles(id) ON DELETE CASCADE,
  status            VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected')),
  reviewed_by       UUID REFERENCES auth.users(id),
  review_note       TEXT,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rcr_group  ON role_change_requests(group_id);
CREATE INDEX IF NOT EXISTS idx_rcr_status ON role_change_requests(status);

ALTER TABLE role_change_requests ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS group_shelves (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id   UUID NOT NULL REFERENCES book_groups(id) ON DELETE CASCADE,
  title      VARCHAR(100) NOT NULL,
  books      JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gs_group ON group_shelves(group_id);

ALTER TABLE group_shelves ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS group_chats (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id     UUID NOT NULL REFERENCES book_groups(id) ON DELETE CASCADE,
  title        VARCHAR(100) NOT NULL,
  tier         INTEGER NOT NULL DEFAULT 1 CHECK (tier IN (1,2,3)),
  rating       NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  is_active    BOOLEAN DEFAULT true,
  created_by   UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gc_group ON group_chats(group_id);
CREATE INDEX IF NOT EXISTS idx_gc_tier  ON group_chats(tier);

ALTER TABLE group_chats ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS chat_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id    UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating     INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(chat_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_cr_chat ON chat_ratings(chat_id);

ALTER TABLE chat_ratings ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS group_chat_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id           UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
  sender_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content           TEXT NOT NULL CHECK (char_length(content) <= 2000),
  is_moderated      BOOLEAN DEFAULT false,
  moderation_reason TEXT,
  ai_flagged        BOOLEAN DEFAULT false,
  ai_flag_reason    TEXT,
  is_deleted        BOOLEAN DEFAULT false,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_gcm_chat    ON group_chat_messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_gcm_sender  ON group_chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_gcm_created ON group_chat_messages(created_at DESC);

ALTER TABLE group_chat_messages ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS book_public_chats (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id               TEXT NOT NULL,
  title                 VARCHAR(100) NOT NULL,
  description           TEXT,
  tier                  INTEGER NOT NULL DEFAULT 1 CHECK (tier IN (1,2,3)),
  reading_scale_min     INTEGER NOT NULL DEFAULT 1 CHECK (reading_scale_min BETWEEN 1 AND 5),
  rating                NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count          INTEGER NOT NULL DEFAULT 0,
  relevancy_score       NUMERIC(5,2) NOT NULL DEFAULT 0,
  host_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  max_members           INTEGER NOT NULL DEFAULT 100 CHECK (max_members <= 100),
  is_active             BOOLEAN DEFAULT true,
  ai_moderation_enabled BOOLEAN DEFAULT true,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bpc_book ON book_public_chats(book_id);
CREATE INDEX IF NOT EXISTS idx_bpc_tier ON book_public_chats(tier);
CREATE INDEX IF NOT EXISTS idx_bpc_host ON book_public_chats(host_id);

ALTER TABLE book_public_chats ENABLE ROW LEVEL SECURITY;


CREATE TABLE IF NOT EXISTS ai_moderation_log (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id   UUID,
  context_type VARCHAR(20) NOT NULL CHECK (context_type IN ('group_chat','book_chat')),
  context_id   UUID NOT NULL,
  content_hash TEXT NOT NULL,
  action       VARCHAR(20) NOT NULL
    CHECK (action IN ('allowed','flagged','blocked','escalated')),
  reason       TEXT,
  confidence   NUMERIC(4,3),
  reviewed_by  UUID REFERENCES auth.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_aml_context ON ai_moderation_log(context_id);
CREATE INDEX IF NOT EXISTS idx_aml_action  ON ai_moderation_log(action);


CREATE TABLE IF NOT EXISTS member_reports (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id    UUID REFERENCES book_groups(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_id   UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'pending'
    CHECK (status IN ('pending','reviewed','dismissed','actioned')),
  reviewed_by UUID REFERENCES auth.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  CHECK (reporter_id != target_id)
);

CREATE INDEX IF NOT EXISTS idx_mr_group  ON member_reports(group_id);
CREATE INDEX IF NOT EXISTS idx_mr_status ON member_reports(status);

ALTER TABLE member_reports ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────
-- RLS POLICIES
-- All tables exist now, so cross-references are safe.
-- ─────────────────────────────────────────────────────────────

-- book_groups
CREATE POLICY "Public groups visible to all; private only to members"
  ON book_groups FOR SELECT
  USING (
    is_active = true AND (
      type = 'public'
      OR owner_id = auth.uid()
      OR EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = id AND gm.user_id = auth.uid() AND gm.banned_at IS NULL
      )
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON book_groups FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owner can update group"
  ON book_groups FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Owner can delete group"
  ON book_groups FOR DELETE USING (auth.uid() = owner_id);


-- group_roles
CREATE POLICY "Members can view roles"
  ON group_roles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM book_groups bg
      LEFT JOIN group_members gm ON gm.group_id = bg.id AND gm.user_id = auth.uid()
      WHERE bg.id = group_id
        AND (bg.type = 'public' OR (gm.user_id IS NOT NULL AND gm.banned_at IS NULL))
    )
  );

CREATE POLICY "Admin can manage roles"
  ON group_roles FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr2 ON gr2.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND gr2.role_type = 'admin'
    )
  );


-- group_members
CREATE POLICY "Members can see who else is in the group"
  ON group_members FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm2
      WHERE gm2.group_id = group_id AND gm2.user_id = auth.uid() AND gm2.banned_at IS NULL
    )
  );

CREATE POLICY "Privileged members can add others"
  ON group_members FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND (gr.role_type IN ('admin','assistant_admin')
             OR gr.privileges @> '["add_member"]'::jsonb)
    )
  );

CREATE POLICY "Privileged members can update (ban/unban)"
  ON group_members FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND (gr.role_type IN ('admin','assistant_admin')
             OR gr.privileges @> '["ban_member"]'::jsonb
             OR gr.privileges @> '["remove_member"]'::jsonb)
    )
  );

CREATE POLICY "Privileged members can remove others"
  ON group_members FOR DELETE
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND (gr.role_type IN ('admin','assistant_admin')
             OR gr.privileges @> '["remove_member"]'::jsonb)
    )
  );


-- role_change_requests
CREATE POLICY "Group members can see requests"
  ON role_change_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.banned_at IS NULL
    )
  );

CREATE POLICY "Privileged members can request role changes"
  ON role_change_requests FOR INSERT
  WITH CHECK (
    auth.uid() = requested_by AND
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND (gr.role_type IN ('admin','assistant_admin')
             OR gr.privileges @> '["assign_role"]'::jsonb)
    )
  );

CREATE POLICY "Admin can review requests"
  ON role_change_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND gr.role_type = 'admin'
    )
  );


-- group_shelves
CREATE POLICY "Members can view shelves"
  ON group_shelves FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid() AND gm.banned_at IS NULL
    )
  );

CREATE POLICY "Privileged members can manage shelves"
  ON group_shelves FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND (gr.role_type IN ('admin','assistant_admin')
             OR gr.privileges @> '["manage_books"]'::jsonb)
    )
  );


-- group_chats
CREATE POLICY "Members or public can view chats"
  ON group_chats FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM book_groups bg
      LEFT JOIN group_members gm ON gm.group_id = bg.id AND gm.user_id = auth.uid()
      WHERE bg.id = group_id AND is_active = true
        AND (bg.type = 'public' OR (gm.user_id IS NOT NULL AND gm.banned_at IS NULL))
    )
  );

CREATE POLICY "Privileged members can create chats"
  ON group_chats FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND (gr.role_type IN ('admin','assistant_admin')
             OR gr.privileges @> '["start_discussion"]'::jsonb)
    )
  );

CREATE POLICY "Admin can update/archive chats"
  ON group_chats FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND gr.role_type = 'admin'
    )
  );


-- chat_ratings
CREATE POLICY "Anyone can view ratings"     ON chat_ratings FOR SELECT USING (true);
CREATE POLICY "Users can rate chats"        ON chat_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own rating" ON chat_ratings FOR UPDATE USING (auth.uid() = user_id);


-- group_chat_messages
CREATE POLICY "Members or public can read non-deleted messages"
  ON group_chat_messages FOR SELECT
  USING (
    is_deleted = false AND
    EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN book_groups bg ON bg.id = gc.group_id
      LEFT JOIN group_members gm ON gm.group_id = bg.id AND gm.user_id = auth.uid()
      WHERE gc.id = chat_id
        AND (bg.type = 'public' OR (gm.user_id IS NOT NULL AND gm.banned_at IS NULL))
    )
  );

CREATE POLICY "Non-banned members can post"
  ON group_chat_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN book_groups bg ON bg.id = gc.group_id
      LEFT JOIN group_members gm ON gm.group_id = bg.id AND gm.user_id = auth.uid()
      WHERE gc.id = chat_id
        AND (bg.type = 'public' OR (gm.user_id IS NOT NULL AND gm.banned_at IS NULL))
    )
  );

CREATE POLICY "Sender or moderator can soft-delete"
  ON group_chat_messages FOR UPDATE
  USING (
    auth.uid() = sender_id
    OR EXISTS (
      SELECT 1 FROM group_chats gc
      JOIN group_members gm ON gm.group_id = gc.group_id
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gc.id = chat_id AND gm.user_id = auth.uid()
        AND (gr.role_type IN ('admin','assistant_admin')
             OR gr.privileges @> '["ban_member"]'::jsonb)
    )
  );


-- book_public_chats
CREATE POLICY "Anyone can view active public book chats"
  ON book_public_chats FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can create book chats"
  ON book_public_chats FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Host can update their chat"
  ON book_public_chats FOR UPDATE USING (auth.uid() = host_id);


-- member_reports
CREATE POLICY "Reporter can view own reports"
  ON member_reports FOR SELECT USING (auth.uid() = reporter_id);

CREATE POLICY "Authenticated users can file reports"
  ON member_reports FOR INSERT
  WITH CHECK (auth.uid() = reporter_id AND reporter_id != target_id);

CREATE POLICY "Admin can review reports in their group"
  ON member_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM group_members gm
      JOIN group_roles gr ON gr.id = gm.role_id
      WHERE gm.group_id = group_id AND gm.user_id = auth.uid()
        AND gr.role_type = 'admin'
    )
  );


-- ─────────────────────────────────────────────────────────────
-- TRIGGERS & FUNCTIONS
-- ─────────────────────────────────────────────────────────────

-- Max 6 custom roles on public groups
CREATE OR REPLACE FUNCTION check_public_role_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_type TEXT; v_count INT;
BEGIN
  SELECT type INTO v_type FROM book_groups WHERE id = NEW.group_id;
  IF v_type = 'public' AND NEW.role_type = 'custom' THEN
    SELECT COUNT(*) INTO v_count FROM group_roles
    WHERE group_id = NEW.group_id AND role_type = 'custom';
    IF v_count >= 6 THEN
      RAISE EXCEPTION 'Public groups may have at most 6 custom roles';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_role_limit ON group_roles;
CREATE TRIGGER trg_role_limit
BEFORE INSERT ON group_roles
FOR EACH ROW EXECUTE FUNCTION check_public_role_limit();


-- Enforce member cap
CREATE OR REPLACE FUNCTION check_member_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_count INT; v_max INT;
BEGIN
  SELECT COUNT(*), bg.max_members
  INTO v_count, v_max
  FROM group_members gm
  JOIN book_groups bg ON bg.id = gm.group_id
  WHERE gm.group_id = NEW.group_id AND gm.banned_at IS NULL
  GROUP BY bg.max_members;
  IF v_count IS NOT NULL AND v_count >= v_max THEN
    RAISE EXCEPTION 'Group is full (max % members)', v_max;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_member_limit ON group_members;
CREATE TRIGGER trg_member_limit
BEFORE INSERT ON group_members
FOR EACH ROW EXECUTE FUNCTION check_member_limit();


-- Enforce shelf cap
CREATE OR REPLACE FUNCTION check_shelf_limit()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_count INT; v_max INT;
BEGIN
  SELECT COUNT(*), bg.max_shelves
  INTO v_count, v_max
  FROM group_shelves gs
  JOIN book_groups bg ON bg.id = gs.group_id
  WHERE gs.group_id = NEW.group_id
  GROUP BY bg.max_shelves;
  IF v_count IS NOT NULL AND v_count >= v_max THEN
    RAISE EXCEPTION 'Shelf limit reached (max % shelves)', v_max;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_shelf_limit ON group_shelves;
CREATE TRIGGER trg_shelf_limit
BEFORE INSERT ON group_shelves
FOR EACH ROW EXECUTE FUNCTION check_shelf_limit();


-- Auto-recalculate chat rating average
CREATE OR REPLACE FUNCTION update_chat_rating()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE v_cid UUID;
BEGIN
  v_cid := COALESCE(NEW.chat_id, OLD.chat_id);
  UPDATE group_chats SET
    rating       = COALESCE((SELECT AVG(rating) FROM chat_ratings WHERE chat_id = v_cid), 0),
    rating_count =          (SELECT COUNT(*)     FROM chat_ratings WHERE chat_id = v_cid)
  WHERE id = v_cid;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_chat_rating ON chat_ratings;
CREATE TRIGGER trg_chat_rating
AFTER INSERT OR UPDATE OR DELETE ON chat_ratings
FOR EACH ROW EXECUTE FUNCTION update_chat_rating();


-- Seed default roles + add owner as Admin on group creation
CREATE OR REPLACE FUNCTION seed_group_defaults()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
DECLARE
  v_admin_role_id UUID;
  ALL_PRIVS  JSONB := '["add_member","remove_member","ban_member","report_member","assign_role","start_discussion","manage_books"]'::jsonb;
  ASST_PRIVS JSONB := '["add_member","remove_member","ban_member","report_member","assign_role","start_discussion","manage_books"]'::jsonb;
  MGR_PRIVS  JSONB := '["add_member","remove_member","report_member","start_discussion"]'::jsonb;
BEGIN
  INSERT INTO group_roles(group_id, name, role_type, privileges, sort_order) VALUES
    (NEW.id, 'Admin',           'admin',          ALL_PRIVS,       1),
    (NEW.id, 'Assistant Admin', 'assistant_admin', ASST_PRIVS,      2),
    (NEW.id, 'Manager',         'manager',         MGR_PRIVS,       3),
    (NEW.id, 'Member',          'member',          '[]'::jsonb,     4);

  SELECT id INTO v_admin_role_id FROM group_roles
  WHERE group_id = NEW.id AND role_type = 'admin';

  INSERT INTO group_members(group_id, user_id, role_id)
  VALUES (NEW.id, NEW.owner_id, v_admin_role_id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_group_defaults ON book_groups;
CREATE TRIGGER trg_group_defaults
AFTER INSERT ON book_groups
FOR EACH ROW EXECUTE FUNCTION seed_group_defaults();


-- ─────────────────────────────────────────────────────────────
-- ENABLE REALTIME (run separately in Supabase dashboard)
-- ─────────────────────────────────────────────────────────────
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_chat_messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_members;
-- ALTER PUBLICATION supabase_realtime ADD TABLE role_change_requests;
-- ALTER PUBLICATION supabase_realtime ADD TABLE group_chats;
