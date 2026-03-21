-- フレンドバトル用RPC関数にgene列を追加（世代ボーナス対応）
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
