-- =========================================
-- バグ修正: 他ユーザーのキャラクターが見える問題を解消
-- =========================================

-- 危険なポリシーを削除（他ユーザーの全キャラクターが見えてしまう）
DROP POLICY IF EXISTS "Authenticated users can view all characters" ON characters;

-- profiles の閲覧ポリシーは対戦検索に必要なので維持
-- （既に存在する場合はスキップされる）
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Authenticated users can view all profiles'
  ) THEN
    CREATE POLICY "Authenticated users can view all profiles"
      ON profiles FOR SELECT TO authenticated USING (true);
  END IF;
END $$;

-- フレンドコード検索RPC
CREATE OR REPLACE FUNCTION search_user_by_friend_code(fc TEXT)
RETURNS TABLE(uid UUID, uname TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT profiles.id, profiles.username
    FROM profiles
    WHERE profiles.id::text ILIKE fc || '%'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- フレンドのバトル用キャラクターデータ取得RPC（SECURITY DEFINERでRLSバイパス）
CREATE OR REPLACE FUNCTION get_friend_battle_character(friend_user_id UUID)
RETURNS TABLE(
  cid UUID,
  cname TEXT,
  cspecies_id UUID,
  cdiscipline INT,
  ccare_miss_count INT,
  cweight INT,
  cmini_game_total_score INT,
  cmini_game_play_count INT,
  chunger INT,
  chappiness INT,
  cgene JSONB
) AS $$
BEGIN
  RETURN QUERY
    SELECT
      characters.id,
      characters.name,
      characters.species_id,
      characters.discipline,
      characters.care_miss_count,
      characters.weight,
      characters.mini_game_total_score,
      characters.mini_game_play_count,
      characters.hunger,
      characters.happiness,
      characters.gene
    FROM characters
    WHERE characters.user_id = friend_user_id
      AND characters.is_alive = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
