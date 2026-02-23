-- そだてるっちWebアプリ データベーススキーマ
-- Supabase (PostgreSQL) 用マイグレーション

-- =========================================
-- 1. 種族マスタ
-- =========================================
CREATE TABLE species (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  stage TEXT NOT NULL CHECK (stage IN ('baby', 'kids', 'young', 'adult')),
  description TEXT NOT NULL DEFAULT '',
  image_key TEXT NOT NULL,
  base_weight INTEGER NOT NULL DEFAULT 10,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'legendary')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- 2. 進化ルールマスタ
-- =========================================
CREATE TABLE evolution_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_species_id UUID NOT NULL REFERENCES species(id),
  to_species_id UUID NOT NULL REFERENCES species(id),
  condition JSONB NOT NULL DEFAULT '{}',
  priority INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- 3. 結婚相手NPCマスタ
-- =========================================
CREATE TABLE marriage_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  species_id UUID NOT NULL REFERENCES species(id),
  personality JSONB NOT NULL DEFAULT '{}',
  gene JSONB NOT NULL DEFAULT '{}',
  image_key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- 4. プロフィール（auth.usersの拡張）
-- =========================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- 5. キャラクター履歴（過去のキャラクター記録）
-- =========================================
CREATE TABLE character_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  species_id UUID NOT NULL REFERENCES species(id),
  final_stage TEXT NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  generation INTEGER NOT NULL DEFAULT 1,
  gene JSONB NOT NULL DEFAULT '{}',
  parent_character_id UUID REFERENCES character_history(id),
  partner_species_id UUID REFERENCES species(id),
  cause_of_departure TEXT NOT NULL CHECK (cause_of_departure IN ('marriage', 'death_age', 'death_sick')),
  age_at_departure INTEGER NOT NULL DEFAULT 0,
  born_at TIMESTAMPTZ NOT NULL,
  departed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- 6. 現在育成中キャラクター
-- =========================================
CREATE TABLE characters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT '',
  species_id UUID NOT NULL REFERENCES species(id),
  stage TEXT NOT NULL DEFAULT 'baby' CHECK (stage IN ('baby', 'kids', 'young', 'adult')),
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  hunger INTEGER NOT NULL DEFAULT 50 CHECK (hunger BETWEEN 0 AND 100),
  happiness INTEGER NOT NULL DEFAULT 50 CHECK (happiness BETWEEN 0 AND 100),
  stamina INTEGER NOT NULL DEFAULT 100 CHECK (stamina BETWEEN 0 AND 100),
  cleanliness INTEGER NOT NULL DEFAULT 100 CHECK (cleanliness BETWEEN 0 AND 100),
  weight INTEGER NOT NULL DEFAULT 10 CHECK (weight BETWEEN 1 AND 99),
  discipline INTEGER NOT NULL DEFAULT 0 CHECK (discipline BETWEEN 0 AND 100),
  is_sick BOOLEAN NOT NULL DEFAULT false,
  age_days INTEGER NOT NULL DEFAULT 0,
  generation INTEGER NOT NULL DEFAULT 1,
  gene JSONB NOT NULL DEFAULT '{}',
  parent_character_id UUID REFERENCES character_history(id),
  care_miss_count INTEGER NOT NULL DEFAULT 0,
  mini_game_total_score INTEGER NOT NULL DEFAULT 0,
  mini_game_play_count INTEGER NOT NULL DEFAULT 0,
  poop_count INTEGER NOT NULL DEFAULT 0,
  born_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_fed_at TIMESTAMPTZ,
  last_played_at TIMESTAMPTZ,
  last_cleaned_at TIMESTAMPTZ,
  last_disciplined_at TIMESTAMPTZ,
  last_calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_sleeping BOOLEAN NOT NULL DEFAULT false,
  stage_started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_alive BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 1ユーザーにつき育成中キャラは1体のみ
CREATE UNIQUE INDEX idx_characters_active_user
  ON characters(user_id)
  WHERE is_alive = true;

-- =========================================
-- 7. ゲーム設定
-- =========================================
CREATE TABLE game_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  sound_enabled BOOLEAN NOT NULL DEFAULT true,
  notification_enabled BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =========================================
-- 8. インデックス
-- =========================================
CREATE INDEX idx_characters_user_id ON characters(user_id);
CREATE INDEX idx_character_history_user_id ON character_history(user_id);
CREATE INDEX idx_evolution_rules_from ON evolution_rules(from_species_id);
CREATE INDEX idx_species_stage ON species(stage);

-- =========================================
-- 9. RLS（Row Level Security）
-- =========================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE character_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE species ENABLE ROW LEVEL SECURITY;
ALTER TABLE evolution_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE marriage_candidates ENABLE ROW LEVEL SECURITY;

-- profiles: 自分のプロフィールのみ
CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- characters: 自分のキャラクターのみ
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE USING (auth.uid() = user_id);

-- character_history: 自分の履歴のみ
CREATE POLICY "Users can view own history"
  ON character_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own history"
  ON character_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- game_settings: 自分の設定のみ
CREATE POLICY "Users can view own settings"
  ON game_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings"
  ON game_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings"
  ON game_settings FOR UPDATE USING (auth.uid() = user_id);

-- マスタデータ: 全ユーザー読み取り可
CREATE POLICY "Anyone can view species"
  ON species FOR SELECT USING (true);
CREATE POLICY "Anyone can view evolution rules"
  ON evolution_rules FOR SELECT USING (true);
CREATE POLICY "Anyone can view marriage candidates"
  ON marriage_candidates FOR SELECT USING (true);

-- =========================================
-- 10. プロフィール自動作成トリガー
-- =========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'username', 'ユーザー'));
  INSERT INTO public.game_settings (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================
-- 11. updated_at 自動更新トリガー
-- =========================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_game_settings_updated_at
  BEFORE UPDATE ON game_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
