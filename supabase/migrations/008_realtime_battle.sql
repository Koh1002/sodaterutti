-- リアルタイムフレンド対戦用テーブル
CREATE TABLE IF NOT EXISTS battle_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id),
  guest_id UUID NOT NULL REFERENCES profiles(id),
  host_snapshot JSONB NOT NULL,
  guest_snapshot JSONB,
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'playing', 'finished', 'cancelled')),
  winner_id UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ
);

-- インデックス
CREATE INDEX idx_battle_sessions_guest_status ON battle_sessions(guest_id, status);
CREATE INDEX idx_battle_sessions_host_status ON battle_sessions(host_id, status);
CREATE INDEX idx_battle_sessions_created_at ON battle_sessions(created_at);

-- RLS
ALTER TABLE battle_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "battle_sessions_select" ON battle_sessions
  FOR SELECT USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "battle_sessions_insert" ON battle_sessions
  FOR INSERT WITH CHECK (auth.uid() = host_id);

CREATE POLICY "battle_sessions_update" ON battle_sessions
  FOR UPDATE USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "battle_sessions_delete" ON battle_sessions
  FOR DELETE USING (auth.uid() = host_id);

-- バトル招待を送信するRPC
CREATE OR REPLACE FUNCTION create_battle_invite(
  opponent_friend_code TEXT,
  snapshot JSONB
)
RETURNS UUID AS $$
DECLARE
  opponent_uid UUID;
  session_id UUID;
BEGIN
  -- フレンドコード検索
  SELECT id INTO opponent_uid
  FROM profiles
  WHERE LEFT(id::text, LENGTH(opponent_friend_code)) = LOWER(opponent_friend_code);

  IF opponent_uid IS NULL THEN
    RAISE EXCEPTION 'フレンドが見つかりません';
  END IF;

  IF opponent_uid = auth.uid() THEN
    RAISE EXCEPTION '自分自身には送れません';
  END IF;

  -- 既存の待機中セッションをキャンセル
  UPDATE battle_sessions
  SET status = 'cancelled'
  WHERE host_id = auth.uid()
    AND status = 'waiting'
    AND created_at > now() - INTERVAL '5 minutes';

  -- 新セッション作成
  INSERT INTO battle_sessions (host_id, guest_id, host_snapshot)
  VALUES (auth.uid(), opponent_uid, snapshot)
  RETURNING id INTO session_id;

  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 自分宛のバトル招待を取得するRPC
CREATE OR REPLACE FUNCTION get_pending_battle_invites()
RETURNS TABLE(
  session_id UUID,
  host_user_id UUID,
  host_name TEXT,
  host_snapshot JSONB,
  session_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      bs.id,
      bs.host_id,
      p.username,
      bs.host_snapshot,
      bs.created_at
    FROM battle_sessions bs
    JOIN profiles p ON p.id = bs.host_id
    WHERE bs.guest_id = auth.uid()
      AND bs.status = 'waiting'
      AND bs.created_at > now() - INTERVAL '5 minutes'
    ORDER BY bs.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- バトル招待を受諾するRPC
CREATE OR REPLACE FUNCTION accept_battle_invite(
  p_session_id UUID,
  snapshot JSONB
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE battle_sessions
  SET guest_snapshot = snapshot,
      status = 'playing',
      started_at = now()
  WHERE id = p_session_id
    AND guest_id = auth.uid()
    AND status = 'waiting';

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
