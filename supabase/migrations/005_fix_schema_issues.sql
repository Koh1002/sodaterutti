-- =========================================
-- スキーマ修正マイグレーション
-- C1: cause_of_departure に 'evolution' を追加
-- 欠落インデックスの追加
-- 欠落RLS DELETEポリシーの追加
-- =========================================

-- =========================================
-- 1. cause_of_departure CHECK制約に 'evolution' を追加
--    進化時にcharacter_historyに記録するため必要
-- =========================================
ALTER TABLE character_history DROP CONSTRAINT IF EXISTS character_history_cause_of_departure_check;
ALTER TABLE character_history ADD CONSTRAINT character_history_cause_of_departure_check
  CHECK (cause_of_departure IN ('marriage', 'death_age', 'death_sick', 'evolution'));

-- =========================================
-- 2. 欠落しているFK列のインデックス追加
-- =========================================
CREATE INDEX IF NOT EXISTS idx_evolution_rules_to ON evolution_rules(to_species_id);
CREATE INDEX IF NOT EXISTS idx_characters_species_id ON characters(species_id);
CREATE INDEX IF NOT EXISTS idx_character_history_species_id ON character_history(species_id);
CREATE INDEX IF NOT EXISTS idx_character_history_parent ON character_history(parent_character_id);
CREATE INDEX IF NOT EXISTS idx_character_history_partner ON character_history(partner_species_id);
CREATE INDEX IF NOT EXISTS idx_marriage_candidates_species ON marriage_candidates(species_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement ON user_achievements(achievement_id);

-- =========================================
-- 3. 欠落しているRLS DELETEポリシー追加
-- =========================================

-- profiles: DELETE
CREATE POLICY "Users can delete own profile"
  ON profiles FOR DELETE USING (auth.uid() = id);

-- character_history: UPDATE, DELETE
CREATE POLICY "Users can update own history"
  ON character_history FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own history"
  ON character_history FOR DELETE USING (auth.uid() = user_id);

-- game_settings: DELETE
CREATE POLICY "Users can delete own settings"
  ON game_settings FOR DELETE USING (auth.uid() = user_id);

-- daily_missions: DELETE
CREATE POLICY "Users can delete own missions"
  ON daily_missions FOR DELETE USING (auth.uid() = user_id);

-- user_achievements: UPDATE, DELETE
CREATE POLICY "Users can update own user_achievements"
  ON user_achievements FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own user_achievements"
  ON user_achievements FOR DELETE USING (auth.uid() = user_id);
