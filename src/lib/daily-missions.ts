/**
 * デイリーミッション定義と生成ロジック
 */

export interface MissionTemplate {
  type: string;
  label: string;
  targetCount: number;
  rewardType: 'happiness' | 'hunger' | 'stamina' | 'cleanliness';
  rewardAmount: number;
}

const MISSION_POOL: MissionTemplate[] = [
  // お世話系
  { type: 'feed', label: 'ごはんを2回あげよう', targetCount: 2, rewardType: 'happiness', rewardAmount: 10 },
  { type: 'feed', label: 'ごはんを3回あげよう', targetCount: 3, rewardType: 'happiness', rewardAmount: 15 },
  { type: 'clean', label: 'そうじを1回しよう', targetCount: 1, rewardType: 'happiness', rewardAmount: 8 },
  { type: 'clean', label: 'そうじを2回しよう', targetCount: 2, rewardType: 'happiness', rewardAmount: 12 },
  { type: 'discipline', label: 'しつけを1回しよう', targetCount: 1, rewardType: 'stamina', rewardAmount: 10 },
  // ミニゲーム系
  { type: 'game_play', label: 'ミニゲームを2回遊ぼう', targetCount: 2, rewardType: 'happiness', rewardAmount: 12 },
  { type: 'game_play', label: 'ミニゲームを3回遊ぼう', targetCount: 3, rewardType: 'happiness', rewardAmount: 18 },
  { type: 'game_win', label: 'ミニゲームで2回勝とう', targetCount: 2, rewardType: 'happiness', rewardAmount: 15 },
  // 散歩系
  { type: 'walk', label: 'おさんぽに1回行こう', targetCount: 1, rewardType: 'happiness', rewardAmount: 10 },
  { type: 'walk', label: 'おさんぽに2回行こう', targetCount: 2, rewardType: 'happiness', rewardAmount: 15 },
  // 複合系
  { type: 'any_action', label: 'お世話を5回しよう', targetCount: 5, rewardType: 'happiness', rewardAmount: 20 },
  { type: 'any_action', label: 'お世話を8回しよう', targetCount: 8, rewardType: 'stamina', rewardAmount: 25 },
  // 特殊
  { type: 'login', label: 'アプリを開こう', targetCount: 1, rewardType: 'happiness', rewardAmount: 5 },
  { type: 'snack', label: 'おやつをあげよう', targetCount: 1, rewardType: 'hunger', rewardAmount: 10 },
];

/** 本日のミッションを3つ生成 */
export function generateDailyMissions(): MissionTemplate[] {
  const shuffled = [...MISSION_POOL].sort(() => Math.random() - 0.5);
  const selected: MissionTemplate[] = [];
  const usedTypes = new Set<string>();

  for (const mission of shuffled) {
    // 同じtypeのミッションは1つまで
    if (!usedTypes.has(mission.type) && selected.length < 3) {
      selected.push(mission);
      usedTypes.add(mission.type);
    }
  }

  // loginミッションが選ばれなかった場合、必ず1つ追加（初回3枠未満の場合）
  if (selected.length < 3 && !usedTypes.has('login')) {
    const login = MISSION_POOL.find(m => m.type === 'login');
    if (login) selected.push(login);
  }

  return selected;
}

/** アクションに対応するミッションタイプを返す */
export function getMatchingMissionTypes(action: string): string[] {
  const mapping: Record<string, string[]> = {
    feed: ['feed', 'any_action'],
    snack: ['snack', 'feed', 'any_action'],
    clean: ['clean', 'any_action'],
    cure: ['any_action'],
    discipline: ['discipline', 'any_action'],
    walk: ['walk', 'any_action'],
    game_play: ['game_play', 'any_action'],
    game_win: ['game_win'],
    login: ['login'],
  };
  return mapping[action] || ['any_action'];
}
