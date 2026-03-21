-- =========================================
-- マルチプレイ機能: 非同期バトル + 協力ゲーム
-- =========================================

-- 非同期バトルチャレンジ
CREATE TABLE IF NOT EXISTS battle_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_id UUID NOT NULL REFERENCES profiles(id),
  opponent_id UUID NOT NULL REFERENCES profiles(id),
  -- チャレンジャーのキャラスナップショット
  challenger_snapshot JSONB NOT NULL,
  -- 対戦相手のキャラスナップショット（受諾時に記録）
  opponent_snapshot JSONB,
  -- pending → accepted → resolved / declined / expired
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'accepted', 'resolved', 'declined', 'expired')),
  winner_id UUID REFERENCES profiles(id),
  battle_log JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  resolved_at TIMESTAMPTZ,
  CONSTRAINT different_players CHECK (challenger_id != opponent_id)
);

CREATE INDEX idx_battle_challenges_opponent ON battle_challenges(opponent_id, status);
CREATE INDEX idx_battle_challenges_challenger ON battle_challenges(challenger_id, status);

-- RLS
ALTER TABLE battle_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own challenges"
  ON battle_challenges FOR SELECT
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create challenges"
  ON battle_challenges FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update own challenges"
  ON battle_challenges FOR UPDATE
  TO authenticated
  USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- 協力ゲームルーム
CREATE TABLE IF NOT EXISTS coop_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  host_id UUID NOT NULL REFERENCES profiles(id),
  guest_id UUID REFERENCES profiles(id),
  room_code TEXT NOT NULL UNIQUE,
  -- waiting → playing → finished
  status TEXT NOT NULL DEFAULT 'waiting'
    CHECK (status IN ('waiting', 'playing', 'finished')),
  game_type TEXT NOT NULL DEFAULT 'cleaning_relay',
  -- ゲーム状態
  host_score INT NOT NULL DEFAULT 0,
  guest_score INT NOT NULL DEFAULT 0,
  target_score INT NOT NULL DEFAULT 50,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_coop_rooms_code ON coop_rooms(room_code) WHERE status = 'waiting';

-- RLS
ALTER TABLE coop_rooms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rooms"
  ON coop_rooms FOR SELECT
  TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

CREATE POLICY "Users can create rooms"
  ON coop_rooms FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = host_id);

CREATE POLICY "Users can update own rooms"
  ON coop_rooms FOR UPDATE
  TO authenticated
  USING (auth.uid() = host_id OR auth.uid() = guest_id);

-- ルームコードでルームを検索するRPC（RLSバイパス）
CREATE OR REPLACE FUNCTION join_coop_room(code TEXT)
RETURNS TABLE(
  room_id UUID,
  room_host_id UUID,
  room_status TEXT,
  room_game_type TEXT,
  room_target_score INT
) AS $$
BEGIN
  -- ゲストとして参加
  UPDATE coop_rooms
    SET guest_id = auth.uid()
    WHERE room_code = code
      AND status = 'waiting'
      AND guest_id IS NULL
      AND host_id != auth.uid();

  RETURN QUERY
    SELECT
      coop_rooms.id,
      coop_rooms.host_id,
      coop_rooms.status,
      coop_rooms.game_type,
      coop_rooms.target_score
    FROM coop_rooms
    WHERE room_code = code
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- チャレンジ送信用RPC（相手のキャラ確認なしで送信可能）
CREATE OR REPLACE FUNCTION send_battle_challenge(
  opponent_friend_code TEXT,
  snapshot JSONB
)
RETURNS UUID AS $$
DECLARE
  opp_id UUID;
  challenge_id UUID;
BEGIN
  -- フレンドコードから相手を検索
  SELECT id INTO opp_id
    FROM profiles
    WHERE id::text ILIKE opponent_friend_code || '%'
    LIMIT 1;

  IF opp_id IS NULL THEN
    RAISE EXCEPTION 'フレンドが見つかりません';
  END IF;

  IF opp_id = auth.uid() THEN
    RAISE EXCEPTION '自分にチャレンジは送れません';
  END IF;

  INSERT INTO battle_challenges (challenger_id, opponent_id, challenger_snapshot)
    VALUES (auth.uid(), opp_id, snapshot)
    RETURNING id INTO challenge_id;

  RETURN challenge_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 受信チャレンジ一覧取得RPC
CREATE OR REPLACE FUNCTION get_pending_challenges()
RETURNS TABLE(
  challenge_id UUID,
  challenger_user_id UUID,
  challenger_name TEXT,
  challenger_snapshot JSONB,
  challenge_created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      bc.id,
      bc.challenger_id,
      p.username,
      bc.challenger_snapshot,
      bc.created_at
    FROM battle_challenges bc
    JOIN profiles p ON p.id = bc.challenger_id
    WHERE bc.opponent_id = auth.uid()
      AND bc.status = 'pending'
      AND bc.created_at > now() - interval '24 hours'
    ORDER BY bc.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
