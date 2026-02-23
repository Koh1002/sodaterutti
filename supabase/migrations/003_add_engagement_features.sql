-- そだてるっち 飽き防止機能追加マイグレーション
-- 散歩・デイリーミッション・実績システム

-- =========================================
-- 1. characters テーブルに散歩・ミニゲーム拡張カラム追加
-- =========================================
ALTER TABLE characters ADD COLUMN IF NOT EXISTS last_walked_at TIMESTAMPTZ;
ALTER TABLE characters ADD COLUMN IF NOT EXISTS mini_game_cooldowns JSONB NOT NULL DEFAULT '{}';
ALTER TABLE characters ADD COLUMN IF NOT EXISTS walk_count INTEGER NOT NULL DEFAULT 0;

-- =========================================
-- 2. デイリーミッション
-- =========================================
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  mission_type TEXT NOT NULL,
  mission_label TEXT NOT NULL,
  target_count INTEGER NOT NULL DEFAULT 1,
  current_count INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  reward_type TEXT NOT NULL DEFAULT 'happiness',
  reward_amount INTEGER NOT NULL DEFAULT 10,
  mission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_daily_missions_user_date ON daily_missions(user_id, mission_date);

ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions"
  ON daily_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own missions"
  ON daily_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own missions"
  ON daily_missions FOR UPDATE USING (auth.uid() = user_id);

-- =========================================
-- 3. 実績マスタ
-- =========================================
CREATE TABLE achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏆',
  category TEXT NOT NULL DEFAULT 'general',
  condition_type TEXT NOT NULL,
  condition_value INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT USING (true);

-- =========================================
-- 4. ユーザー実績
-- =========================================
CREATE TABLE user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id),
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, achievement_id)
);

CREATE INDEX idx_user_achievements_user ON user_achievements(user_id);

ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own achievements"
  ON user_achievements FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =========================================
-- 5. 実績シードデータ
-- =========================================
INSERT INTO achievements (key, name, description, icon, category, condition_type, condition_value) VALUES
-- お世話系
('first_feed', 'はじめてのごはん', 'はじめてごはんをあげた', '🍚', 'care', 'feed_count', 1),
('feed_10', 'グルメマスター', '10回ごはんをあげた', '🍽️', 'care', 'feed_count', 10),
('feed_50', '一流シェフ', '50回ごはんをあげた', '👨‍🍳', 'care', 'feed_count', 50),
('first_clean', 'おそうじデビュー', 'はじめて掃除をした', '🧹', 'care', 'clean_count', 1),
('clean_20', 'きれいずき', '20回掃除をした', '✨', 'care', 'clean_count', 20),
('first_cure', 'やさしいおいしゃさん', 'はじめて治療をした', '💊', 'care', 'cure_count', 1),
-- ミニゲーム系
('first_game', 'あそびのはじまり', 'はじめてミニゲームで遊んだ', '🎮', 'game', 'game_play_count', 1),
('game_10', 'ゲームずき', '10回ミニゲームで遊んだ', '🕹️', 'game', 'game_play_count', 10),
('game_50', 'ゲーマー', '50回ミニゲームで遊んだ', '🏅', 'game', 'game_play_count', 50),
('perfect_janken', 'じゃんけんキング', 'じゃんけんで3連勝した', '👑', 'game', 'janken_perfect', 1),
('memory_fast', '記憶の天才', '神経衰弱を30秒以内にクリアした', '🧠', 'game', 'memory_fast_clear', 1),
-- 散歩系
('first_walk', 'はじめてのおさんぽ', 'はじめて散歩に行った', '👟', 'walk', 'walk_count', 1),
('walk_10', 'おさんぽ好き', '10回散歩に行った', '🚶', 'walk', 'walk_count', 10),
('walk_50', '冒険家', '50回散歩に行った', '🗺️', 'walk', 'walk_count', 50),
('rare_walk_event', 'ラッキー！', '散歩でレアイベントに遭遇した', '🍀', 'walk', 'rare_event', 1),
-- 成長系
('first_evolution', 'へんしん！', 'はじめて進化した', '🌟', 'growth', 'evolution_count', 1),
('reach_adult', 'りっぱなおとな', 'アダルト期に到達した', '🎓', 'growth', 'reach_adult', 1),
('generation_3', '名家のはじまり', '3代目に到達した', '👪', 'growth', 'generation', 3),
('generation_10', '大家族', '10代目に到達した', '🏰', 'growth', 'generation', 10),
-- ミッション系
('mission_first', 'ミッションクリア！', 'はじめてデイリーミッションを達成した', '📋', 'mission', 'mission_complete', 1),
('mission_streak_7', '1週間連続ログイン', '7日連続でミッションを達成した', '🔥', 'mission', 'mission_streak', 7),
-- コレクション系
('species_5', 'コレクター', '5種類の種族を発見した', '📚', 'collection', 'species_discovered', 5),
('species_15', 'マスターコレクター', '15種類の種族を発見した', '🏆', 'collection', 'species_discovered', 15),
('species_all', 'コンプリート！', '全種族を発見した', '💎', 'collection', 'species_discovered', 22);
