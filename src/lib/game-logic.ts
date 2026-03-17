/**
 * ゲームロジック（時間経過・お世話アクション・進化判定）
 * サーバー/クライアント両方で使用可能な純粋関数群
 */

import type { Database } from '@/types/database';

type Character = Database['public']['Tables']['characters']['Row'];
type CharacterUpdate = Database['public']['Tables']['characters']['Update'];

// =========================================
// 定数
// =========================================

/** ステージごとの滞在日数 */
export const STAGE_DURATION: Record<string, number> = {
  baby: 1,
  kids: 2,
  young: 3,
  adult: 5,
};

/** パラメータ自然減少レート（1時間あたり） */
export const DECAY_RATES = {
  hunger: -5,        // 1時間ごとに-5
  happiness: -1.5,   // 2時間ごとに-3 → 1時間あたり-1.5
  cleanliness: -0.67, // 3時間ごとに-2 → 1時間あたり-0.67
} as const;

/** 睡眠中は減少率が半分 */
export const SLEEP_DECAY_MULTIPLIER = 0.5;

/** 睡眠中の体力回復（1時間あたり） */
export const SLEEP_STAMINA_RECOVERY = 10;

/** 自動睡眠の時間帯 */
export const AUTO_SLEEP_START = 0;  // 00:00
export const AUTO_SLEEP_END = 6;    // 06:00

/** クールダウン（ミリ秒） */
export const COOLDOWNS = {
  feed: 5 * 60 * 1000,         // 5分
  snack: 15 * 60 * 1000,       // 15分
  play: 60 * 60 * 1000,        // 1時間
  discipline: 2 * 60 * 60 * 1000, // 2時間
  walk: 30 * 60 * 1000,        // 30分
} as const;

/** ミニゲーム個別クールダウン（ミリ秒） */
export const MINI_GAME_COOLDOWNS: Record<string, number> = {
  janken: 30 * 60 * 1000,     // 30分
  memory: 30 * 60 * 1000,     // 30分
  rhythm: 20 * 60 * 1000,     // 20分
  quiz: 20 * 60 * 1000,       // 20分
};

/** うんち発生確率（1時間あたり） */
export const POOP_CHANCE_PER_HOUR = 0.15;

/** 病気発生条件 */
export const SICK_THRESHOLD = {
  hunger: 10,
  cleanliness: 10,
};

// =========================================
// 時間経過計算
// =========================================

export interface StatusCalculationResult {
  updates: CharacterUpdate;
  careMissOccurred: boolean;
  poopGenerated: boolean;
  shouldCheckEvolution: boolean;
  gotSick: boolean;
}

/** 経過時間に基づいてパラメータを再計算する */
export function calculateTimeElapsed(
  character: Character,
  now: Date = new Date()
): StatusCalculationResult {
  const lastCalculated = new Date(character.last_calculated_at);
  const elapsedMs = now.getTime() - lastCalculated.getTime();
  const elapsedHours = elapsedMs / (1000 * 60 * 60);

  if (elapsedHours < 0.01) {
    return {
      updates: { last_calculated_at: now.toISOString() },
      careMissOccurred: false,
      poopGenerated: false,
      shouldCheckEvolution: false,
      gotSick: false,
    };
  }

  const isSleeping = character.is_sleeping || isAutoSleepTime(now);
  const decayMultiplier = isSleeping ? SLEEP_DECAY_MULTIPLIER : 1;

  // パラメータ減少計算
  let hunger = character.hunger + DECAY_RATES.hunger * elapsedHours * decayMultiplier;
  let happiness = character.happiness + DECAY_RATES.happiness * elapsedHours * decayMultiplier;
  let cleanliness = character.cleanliness + DECAY_RATES.cleanliness * elapsedHours * decayMultiplier;
  let stamina = character.stamina;

  // 睡眠中は体力回復
  if (isSleeping) {
    stamina = Math.min(100, stamina + SLEEP_STAMINA_RECOVERY * elapsedHours);
  }

  // 範囲制限
  hunger = clamp(hunger, 0, 100);
  happiness = clamp(happiness, 0, 100);
  cleanliness = clamp(cleanliness, 0, 100);
  stamina = clamp(stamina, 0, 100);

  // お世話ミス判定（病気閾値と統一）
  const careMissOccurred = hunger <= SICK_THRESHOLD.hunger || happiness === 0;
  const careMissCount = character.care_miss_count + (careMissOccurred ? 1 : 0);

  // うんち発生判定（長時間放置で複数個生成）
  let poopCount = character.poop_count;
  let poopGenerated = false;
  const expectedPoops = Math.floor(elapsedHours * POOP_CHANCE_PER_HOUR);
  const fractionalChance = (elapsedHours * POOP_CHANCE_PER_HOUR) - expectedPoops;
  let newPoops = expectedPoops + (Math.random() < fractionalChance ? 1 : 0);
  newPoops = Math.min(newPoops, 10); // 上限10個
  if (newPoops > 0) {
    poopGenerated = true;
    poopCount += newPoops;
    cleanliness = clamp(cleanliness - 20 * newPoops, 0, 100);
  }

  // 病気判定
  let isSick = character.is_sick;
  let gotSick = false;
  if (!isSick && (hunger <= SICK_THRESHOLD.hunger || cleanliness <= SICK_THRESHOLD.cleanliness)) {
    if (Math.random() < 0.3) {
      isSick = true;
      gotSick = true;
    }
  }

  // 年齢・進化判定
  const bornAt = new Date(character.born_at);
  const ageDays = Math.floor((now.getTime() - bornAt.getTime()) / (1000 * 60 * 60 * 24));
  const stageStartedAt = new Date(character.stage_started_at);
  const daysInStage = Math.floor((now.getTime() - stageStartedAt.getTime()) / (1000 * 60 * 60 * 24));
  const shouldCheckEvolution = daysInStage >= (STAGE_DURATION[character.stage] || 999);

  return {
    updates: {
      hunger: Math.round(hunger),
      happiness: Math.round(happiness),
      cleanliness: Math.round(cleanliness),
      stamina: Math.round(stamina),
      is_sick: isSick,
      age_days: ageDays,
      care_miss_count: careMissCount,
      poop_count: poopCount,
      is_sleeping: isSleeping,
      last_calculated_at: now.toISOString(),
    },
    careMissOccurred,
    poopGenerated,
    shouldCheckEvolution,
    gotSick,
  };
}

// =========================================
// お世話アクション
// =========================================

export type ActionResult = {
  success: boolean;
  message: string;
  updates?: CharacterUpdate;
};

/** ごはん (おにぎり/パン/ケーキ) */
export function feedAction(character: Character, foodType: 'onigiri' | 'bread' | 'cake'): ActionResult {
  if (character.is_sleeping) return { success: false, message: '寝ている間はごはんをあげられません' };
  if (character.is_sick) return { success: false, message: '病気の時はまず治療しましょう' };

  if (character.last_fed_at) {
    const cooldownEnd = new Date(character.last_fed_at).getTime() + COOLDOWNS.feed;
    if (Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000);
      return { success: false, message: `あと${remaining}分待ってね` };
    }
  }

  const effects: Record<string, { hunger: number; happiness: number; weight: number }> = {
    onigiri: { hunger: 56, happiness: 0, weight: 2 },
    bread: { hunger: 56, happiness: 0, weight: 2 },
    cake: { hunger: 56, happiness: 5, weight: 5 },
  };

  const effect = effects[foodType];
  return {
    success: true,
    message: foodType === 'cake' ? 'ケーキ！うれしそう！' : 'もぐもぐ...おいしい！',
    updates: {
      hunger: clamp(character.hunger + effect.hunger, 0, 100),
      happiness: clamp(character.happiness + effect.happiness, 0, 100),
      weight: clamp(character.weight + effect.weight, 1, 99),
      last_fed_at: new Date().toISOString(),
    },
  };
}

/** おやつ */
export function snackAction(character: Character): ActionResult {
  if (character.is_sleeping) return { success: false, message: '寝ている間はおやつをあげられません' };

  if (character.last_fed_at) {
    const cooldownEnd = new Date(character.last_fed_at).getTime() + COOLDOWNS.snack;
    if (Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000);
      return { success: false, message: `あと${remaining}分待ってね` };
    }
  }

  return {
    success: true,
    message: 'おやつ大好き！',
    updates: {
      hunger: clamp(character.hunger + 14, 0, 100),
      happiness: clamp(character.happiness + 10, 0, 100),
      weight: clamp(character.weight + 3, 1, 99),
      last_fed_at: new Date().toISOString(),
    },
  };
}

/** 遊ぶ（ミニゲーム結果反映用） */
export function playAction(character: Character, gameScore: number): ActionResult {
  if (character.is_sleeping) return { success: false, message: '寝ている間は遊べません' };
  if (character.is_sick) return { success: false, message: '病気の時はまず治療しましょう' };
  if (character.stamina < 10) return { success: false, message: '疲れすぎています...休ませてあげて' };

  if (character.last_played_at) {
    const cooldownEnd = new Date(character.last_played_at).getTime() + COOLDOWNS.play;
    if (Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000);
      return { success: false, message: `あと${remaining}分待ってね` };
    }
  }

  // スコアに応じた幸福度上昇
  let happinessGain: number;
  let message: string;
  if (gameScore >= 2) {
    happinessGain = 20;
    message = '大成功！とっても楽しかった！';
  } else if (gameScore >= 1) {
    happinessGain = 15;
    message = '楽しかったね！';
  } else {
    happinessGain = 5;
    message = 'まあまあだったかな...';
  }

  return {
    success: true,
    message,
    updates: {
      happiness: clamp(character.happiness + happinessGain, 0, 100),
      stamina: clamp(character.stamina - 10, 0, 100),
      weight: clamp(character.weight - 1, 1, 99),
      mini_game_total_score: character.mini_game_total_score + gameScore,
      mini_game_play_count: character.mini_game_play_count + 1,
      last_played_at: new Date().toISOString(),
    },
  };
}

/** 掃除 */
export function cleanAction(character: Character): ActionResult {
  // うんちがある場合：うんち除去 + 清潔さ大回復
  if (character.poop_count > 0) {
    return {
      success: true,
      message: 'ピカピカ！きれいになった！',
      updates: {
        cleanliness: clamp(character.cleanliness + 30, 0, 100),
        poop_count: Math.max(0, character.poop_count - 1),
      },
    };
  }

  // うんちがなくても軽い掃除ができる（清潔さ少し回復）
  if (character.cleanliness >= 100) {
    return { success: false, message: 'もうピカピカだよ！' };
  }

  return {
    success: true,
    message: 'さっとお掃除！すこしきれいになった',
    updates: {
      cleanliness: clamp(character.cleanliness + 10, 0, 100),
    },
  };
}

/** 治療 */
export function cureAction(character: Character): ActionResult {
  if (!character.is_sick) {
    return { success: false, message: '元気だよ！治療の必要はないよ' };
  }

  return {
    success: true,
    message: '元気になった！よかったね！',
    updates: {
      is_sick: false,
    },
  };
}

/** しつけ */
export function disciplineAction(character: Character): ActionResult {
  if (character.is_sleeping) return { success: false, message: '寝ている間はしつけできません' };

  if (character.last_disciplined_at) {
    const cooldownEnd = new Date(character.last_disciplined_at).getTime() + COOLDOWNS.discipline;
    if (Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000);
      return { success: false, message: `あと${remaining}分待ってね` };
    }
  }

  return {
    success: true,
    message: 'しっかりしつけました！',
    updates: {
      discipline: clamp(character.discipline + 10, 0, 100),
      last_disciplined_at: new Date().toISOString(),
    },
  };
}

/** 散歩 */
export function walkAction(character: Character): ActionResult {
  if (character.is_sleeping) return { success: false, message: '寝ている間はおさんぽに行けません' };
  if (character.is_sick) return { success: false, message: '病気の時はおさんぽに行けません' };
  if (character.stamina < 15) return { success: false, message: '疲れすぎています...休ませてあげて' };

  if (character.last_walked_at) {
    const cooldownEnd = new Date(character.last_walked_at).getTime() + COOLDOWNS.walk;
    if (Date.now() < cooldownEnd) {
      const remaining = Math.ceil((cooldownEnd - Date.now()) / 60000);
      return { success: false, message: `あと${remaining}分待ってね` };
    }
  }

  // 実際の効果はwalk-eventsで計算し、storeで適用する
  return {
    success: true,
    message: 'おさんぽに出発！',
    updates: {
      last_walked_at: new Date().toISOString(),
      walk_count: (character.walk_count || 0) + 1,
    },
  };
}

/** ミニゲームのクールダウンチェック */
export function checkMiniGameCooldown(character: Character, gameType: string): { canPlay: boolean; remaining: number } {
  const cooldowns = (character.mini_game_cooldowns || {}) as Record<string, string>;
  const lastPlayed = cooldowns[gameType];
  if (!lastPlayed) return { canPlay: true, remaining: 0 };

  const cooldownMs = MINI_GAME_COOLDOWNS[gameType] || COOLDOWNS.play;
  const cooldownEnd = new Date(lastPlayed).getTime() + cooldownMs;
  const remaining = Math.max(0, Math.ceil((cooldownEnd - Date.now()) / 60000));

  return { canPlay: remaining === 0, remaining };
}

/** 就寝/起床 */
export function sleepAction(character: Character): ActionResult {
  if (character.is_sleeping) {
    return {
      success: true,
      message: 'おはよう！元気いっぱい！',
      updates: {
        is_sleeping: false,
      },
    };
  }

  return {
    success: true,
    message: 'おやすみなさい...zzz',
    updates: {
      is_sleeping: true,
    },
  };
}

// =========================================
// 進化スコア計算
// =========================================

export interface CareScore {
  total: number;
  breakdown: {
    careMiss: number;
    discipline: number;
    weight: number;
    miniGame: number;
  };
}

/** お世話スコアを計算（0-100） */
export function calculateCareScore(character: Character, baseWeight: number): CareScore {
  // お世話ミス: 0回=100点, 10回以上=0点
  const careMissScore = Math.max(0, 100 - character.care_miss_count * 10);

  // しつけ度: そのまま0-100
  const disciplineScore = character.discipline;

  // 体重: 標準体重からの乖離が少ないほど高スコア
  const weightDiff = Math.abs(character.weight - baseWeight);
  const weightScore = Math.max(0, 100 - weightDiff * 5);

  // ミニゲーム: 平均スコア（0-3を0-100に変換）
  const avgGameScore = character.mini_game_play_count > 0
    ? character.mini_game_total_score / character.mini_game_play_count
    : 1.5; // デフォルト中間値
  const miniGameScore = Math.min(100, (avgGameScore / 3) * 100);

  // 遺伝スコア: キャラのgeneから取得（未設定なら50）
  const gene = character.gene as Record<string, unknown> | null;
  const geneticsScore = typeof gene?.geneticsScore === 'number'
    ? clamp(gene.geneticsScore, 0, 100)
    : 50;

  // 重み付け合計
  const total = Math.round(
    careMissScore * 0.30 +
    disciplineScore * 0.25 +
    weightScore * 0.15 +
    miniGameScore * 0.15 +
    geneticsScore * 0.15
  );

  return {
    total: clamp(total, 0, 100),
    breakdown: {
      careMiss: Math.round(careMissScore),
      discipline: Math.round(disciplineScore),
      weight: Math.round(weightScore),
      miniGame: Math.round(miniGameScore),
    },
  };
}

// =========================================
// 進化判定
// =========================================

export interface EvolutionRule {
  id: string;
  from_species_id: string;
  to_species_id: string;
  condition: Record<string, number>;
  priority: number;
}

/** 進化ルールに基づいて進化先を決定する */
export function determineEvolution(
  character: Character,
  careScore: number,
  rules: EvolutionRule[]
): string | null {
  const applicableRules = rules
    .filter(r => r.from_species_id === character.species_id)
    .sort((a, b) => b.priority - a.priority);

  for (const rule of applicableRules) {
    const cond = rule.condition;
    let matches = true;

    if (cond.min_care_score !== undefined && careScore < cond.min_care_score) matches = false;
    if (cond.max_care_score !== undefined && careScore > cond.max_care_score) matches = false;
    if (cond.min_discipline !== undefined && character.discipline < cond.min_discipline) matches = false;
    if (cond.max_discipline !== undefined && character.discipline > cond.max_discipline) matches = false;
    if (cond.min_generation !== undefined && character.generation < cond.min_generation) matches = false;

    if (matches) return rule.to_species_id;
  }

  return null;
}

// =========================================
// 死亡判定
// =========================================

export interface DeathCheckResult {
  isDead: boolean;
  cause: 'death_age' | 'death_sick' | null;
}

/** 死亡条件をチェックする */
export function checkDeath(character: Character, now: Date = new Date()): DeathCheckResult {
  // 寿命死: アダルト期到達後、結婚せず7日経過
  if (character.stage === 'adult') {
    const stageStarted = new Date(character.stage_started_at);
    const daysAsAdult = (now.getTime() - stageStarted.getTime()) / (1000 * 60 * 60 * 24);
    if (daysAsAdult >= 7) {
      return { isDead: true, cause: 'death_age' };
    }
  }

  // 病気死: 病気状態で空腹度・清潔度が両方0（重篤状態）
  if (character.is_sick && character.hunger === 0 && character.cleanliness === 0) {
    return { isDead: true, cause: 'death_sick' };
  }

  return { isDead: false, cause: null };
}

// =========================================
// 結婚可能判定
// =========================================

/** 結婚適齢期かどうかを判定する（アダルト期3日目以降） */
export function canMarry(character: Character, now: Date = new Date()): boolean {
  if (character.stage !== 'adult') return false;
  const stageStarted = new Date(character.stage_started_at);
  const daysAsAdult = (now.getTime() - stageStarted.getTime()) / (1000 * 60 * 60 * 24);
  return daysAsAdult >= 3;
}

// =========================================
// ユーティリティ
// =========================================

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function isAutoSleepTime(date: Date): boolean {
  const hour = date.getHours();
  return hour >= AUTO_SLEEP_START && hour < AUTO_SLEEP_END;
}
