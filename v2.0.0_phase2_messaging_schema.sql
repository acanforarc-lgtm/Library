-- ============================================================
-- Your Library v2.0.0 Phase 2 — Messaging Schema Migration
-- Run this in your Supabase SQL Editor (project: wqurkgnossvafujxlehq)
-- ============================================================

-- 1. CONVERSATIONS
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant1_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  participant2_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(participant1_id, participant2_id),
  CHECK (participant1_id < participant2_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_p1 ON conversations(participant1_id);
CREATE INDEX IF NOT EXISTS idx_conv_p2 ON conversations(participant2_id);
CREATE INDEX IF NOT EXISTS idx_conv_last ON conversations(last_message_at DESC);

ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can update their conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);


-- 2. MESSAGES
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  encryption_nonce TEXT,
  is_edited BOOLEAN DEFAULT false,
  edited_at TIMESTAMPTZ,
  is_deleted BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CHECK (sender_id != recipient_id)
);

CREATE INDEX IF NOT EXISTS idx_msg_conv    ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_msg_sender  ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_msg_recip   ON messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_msg_created ON messages(created_at DESC);

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages in their conversations"
  ON messages FOR SELECT
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages"
  ON messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Allow soft-delete by either party
CREATE POLICY "Users can delete messages they sent or received"
  ON messages FOR DELETE
  USING (auth.uid() = sender_id OR auth.uid() = recipient_id);


-- 3. Enable Realtime for messages table
-- (Run this separately if Realtime is not already enabled for messages)
-- ALTER PUBLICATION supabase_realtime ADD TABLE messages;
-- ALTER PUBLICATION supabase_realtime ADD TABLE conversations;
