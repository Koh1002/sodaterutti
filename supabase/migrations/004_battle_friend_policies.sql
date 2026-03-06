-- =========================================
-- フレンド対戦用のRLSポリシー追加・RPC関数
-- =========================================

-- profiles: 認証済みユーザーは他ユーザーのプロフィールも閲覧可能（対戦検索用）
CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

-- characters: 認証済みユーザーは他ユーザーのキャラクターも閲覧可能（対戦用）
CREATE POLICY "Authenticated users can view all characters"
  ON characters FOR SELECT
  TO authenticated
  USING (true);

-- フレンドコード（UUID先頭8文字）でユーザーを検索するRPC関数
CREATE OR REPLACE FUNCTION search_user_by_friend_code(friend_code TEXT)
RETURNS TABLE(id UUID, username TEXT) AS $$
BEGIN
  RETURN QUERY
    SELECT p.id, p.username
    FROM profiles p
    WHERE p.id::text ILIKE friend_code || '%'
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
