-- =========================================
-- フレンド対戦用のRLSポリシー追加・RPC関数
-- =========================================

-- profiles: 認証済みユーザーは他ユーザーのプロフィールも閲覧可能（対戦検索用）
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- characters: 他ユーザーのキャラクター閲覧は RPC 経由のみに制限
-- （直接クエリでは自分のキャラクターのみ表示）

-- フレンドコード（UUID先頭8文字）でユーザーを検索するRPC関数
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

-- フレンドのバトル用キャラクターデータを取得するRPC関数
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
  chappiness INT
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
      characters.happiness
    FROM characters
    WHERE characters.user_id = friend_user_id
      AND characters.is_alive = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
