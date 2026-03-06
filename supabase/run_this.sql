CREATE POLICY "Authenticated users can view all profiles"
  ON profiles FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all characters"
  ON characters FOR SELECT
  TO authenticated
  USING (true);

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
