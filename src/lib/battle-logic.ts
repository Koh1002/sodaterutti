/**
 * バトルシステム: 技データ・戦闘計算ロジック
 */

// =========================================
// 技データ (60種: 威力技45 + 状態異常技15)
// =========================================

export type MoveCategory = 'attack' | 'status';
export type StatusEffect = 'poison' | 'burn' | 'paralyze' | 'confuse' | 'sleep';

export interface BattleMove {
  id: number;
  name: string;
  category: MoveCategory;
  power: number;          // 威力 (0 for status moves)
  accuracy: number;       // 命中率 (0-100)
  effect?: StatusEffect;  // 状態異常技の効果
  effectChance?: number;  // 追加効果発動率 (0-100)
  emoji: string;          // エフェクト用絵文字
  description: string;
}

export const ALL_MOVES: BattleMove[] = [
  // === 威力技 45種 ===
  // -- 軽量技 (威力 20-35) 15種 --
  { id: 1, name: 'ひっかく', category: 'attack', power: 25, accuracy: 95, emoji: '💥', description: 'するどいツメでひっかく' },
  { id: 2, name: 'たいあたり', category: 'attack', power: 30, accuracy: 90, emoji: '💨', description: '体当たりで攻撃' },
  { id: 3, name: 'しっぽアタック', category: 'attack', power: 25, accuracy: 95, emoji: '💫', description: 'しっぽを振り回す' },
  { id: 4, name: 'ぷにぷにパンチ', category: 'attack', power: 20, accuracy: 100, emoji: '👊', description: 'やわらかいパンチ' },
  { id: 5, name: 'ほっぺすりすり', category: 'attack', power: 20, accuracy: 100, emoji: '⚡', description: 'ほっぺで静電気攻撃', effectChance: 20, effect: 'paralyze' },
  { id: 6, name: 'ころがる', category: 'attack', power: 30, accuracy: 85, emoji: '🌀', description: '丸くなって突進' },
  { id: 7, name: 'くすぐる', category: 'attack', power: 20, accuracy: 100, emoji: '😂', description: 'くすぐって混乱させる', effectChance: 15, effect: 'confuse' },
  { id: 8, name: 'はたく', category: 'attack', power: 25, accuracy: 95, emoji: '✋', description: '手ではたく' },
  { id: 9, name: 'かじる', category: 'attack', power: 30, accuracy: 90, emoji: '🦷', description: 'ガブッとかじりつく' },
  { id: 10, name: 'ジャンプキック', category: 'attack', power: 35, accuracy: 85, emoji: '🦶', description: 'ジャンプして蹴る' },
  { id: 11, name: 'にらみつける', category: 'attack', power: 20, accuracy: 100, emoji: '👁️', description: 'するどい視線で攻撃' },
  { id: 12, name: 'ぶつかる', category: 'attack', power: 30, accuracy: 90, emoji: '💢', description: '思いっきりぶつかる' },
  { id: 13, name: 'ふきとばし', category: 'attack', power: 25, accuracy: 95, emoji: '🌬️', description: '息を吹きかける' },
  { id: 14, name: 'しがみつく', category: 'attack', power: 20, accuracy: 100, emoji: '🤗', description: 'しがみついてダメージ' },
  { id: 15, name: 'おしくらまんじゅう', category: 'attack', power: 35, accuracy: 85, emoji: '😤', description: '押し合いへし合い' },

  // -- 中量技 (威力 40-60) 15種 --
  { id: 16, name: 'ほのおのいき', category: 'attack', power: 45, accuracy: 85, emoji: '🔥', description: '炎の息で攻撃', effectChance: 15, effect: 'burn' },
  { id: 17, name: 'みずでっぽう', category: 'attack', power: 40, accuracy: 90, emoji: '💧', description: '水を吹きかける' },
  { id: 18, name: 'かみなり', category: 'attack', power: 50, accuracy: 80, emoji: '⚡', description: '電撃で攻撃', effectChance: 20, effect: 'paralyze' },
  { id: 19, name: 'つむじかぜ', category: 'attack', power: 45, accuracy: 85, emoji: '🌪️', description: 'つむじ風を起こす' },
  { id: 20, name: 'ほしふる', category: 'attack', power: 50, accuracy: 80, emoji: '⭐', description: '星を降らせる' },
  { id: 21, name: 'にじのビーム', category: 'attack', power: 55, accuracy: 80, emoji: '🌈', description: '虹色のビームで攻撃' },
  { id: 22, name: 'もちもちプレス', category: 'attack', power: 45, accuracy: 90, emoji: '🍡', description: 'もちもちボディで押しつぶす' },
  { id: 23, name: 'きらきらスター', category: 'attack', power: 50, accuracy: 85, emoji: '✨', description: 'キラキラ光る星を発射' },
  { id: 24, name: 'どろんこ投げ', category: 'attack', power: 40, accuracy: 90, emoji: '💩', description: 'どろんこをぶつける' },
  { id: 25, name: 'メガトンキック', category: 'attack', power: 60, accuracy: 75, emoji: '🦵', description: '全力のキック' },
  { id: 26, name: 'おにぎりボム', category: 'attack', power: 45, accuracy: 90, emoji: '🍙', description: 'おにぎりを投げつける' },
  { id: 27, name: 'ハートアタック', category: 'attack', power: 50, accuracy: 85, emoji: '💖', description: 'ハートのエネルギーで攻撃' },
  { id: 28, name: 'ロケットずつき', category: 'attack', power: 55, accuracy: 80, emoji: '🚀', description: 'ロケットのように頭突き' },
  { id: 29, name: 'ぐるぐるパンチ', category: 'attack', power: 45, accuracy: 85, emoji: '🌀', description: '回転しながらパンチ', effectChance: 15, effect: 'confuse' },
  { id: 30, name: 'オーロラウェーブ', category: 'attack', power: 50, accuracy: 85, emoji: '🌊', description: 'オーロラの波で攻撃' },

  // -- 重量技 (威力 65-100) 15種 --
  { id: 31, name: 'メテオストライク', category: 'attack', power: 80, accuracy: 70, emoji: '☄️', description: '隕石を落とす' },
  { id: 32, name: 'ギガインパクト', category: 'attack', power: 90, accuracy: 65, emoji: '💥', description: '全力の一撃' },
  { id: 33, name: 'ドラゴンブレス', category: 'attack', power: 75, accuracy: 75, emoji: '🐉', description: '竜の息吹で攻撃', effectChance: 20, effect: 'burn' },
  { id: 34, name: 'コスモフラッシュ', category: 'attack', power: 85, accuracy: 70, emoji: '🌟', description: '宇宙の光で攻撃' },
  { id: 35, name: 'サンダーストーム', category: 'attack', power: 80, accuracy: 70, emoji: '🌩️', description: '雷の嵐で攻撃', effectChance: 25, effect: 'paralyze' },
  { id: 36, name: 'ブリザード', category: 'attack', power: 75, accuracy: 75, emoji: '❄️', description: '吹雪で攻撃' },
  { id: 37, name: 'グランドスラム', category: 'attack', power: 85, accuracy: 70, emoji: '🏆', description: '最強の一撃' },
  { id: 38, name: 'ビッグバンアタック', category: 'attack', power: 100, accuracy: 60, emoji: '💣', description: '大爆発を起こす' },
  { id: 39, name: 'ムーンライトブレイク', category: 'attack', power: 70, accuracy: 80, emoji: '🌙', description: '月光の力で攻撃' },
  { id: 40, name: 'フレアバースト', category: 'attack', power: 75, accuracy: 75, emoji: '🔥', description: '大炎上させる', effectChance: 30, effect: 'burn' },
  { id: 41, name: 'ダークネスフォール', category: 'attack', power: 80, accuracy: 70, emoji: '🌑', description: '闇の力で攻撃' },
  { id: 42, name: 'スーパーノヴァ', category: 'attack', power: 95, accuracy: 60, emoji: '🌞', description: '超新星爆発' },
  { id: 43, name: 'ファイナルブレイク', category: 'attack', power: 90, accuracy: 65, emoji: '⚔️', description: '渾身の一撃' },
  { id: 44, name: 'ギャラクシーエンド', category: 'attack', power: 100, accuracy: 55, emoji: '🌌', description: '銀河を終わらせる一撃' },
  { id: 45, name: 'ミラクルパワー', category: 'attack', power: 65, accuracy: 85, emoji: '🪄', description: '奇跡の力で攻撃' },

  // === 状態異常技 15種 ===
  { id: 46, name: 'どくのこな', category: 'status', power: 0, accuracy: 80, effect: 'poison', emoji: '☠️', description: '毒の粉をまく' },
  { id: 47, name: 'ねむりうた', category: 'status', power: 0, accuracy: 70, effect: 'sleep', emoji: '🎵', description: '子守唄で眠らせる' },
  { id: 48, name: 'でんじは', category: 'status', power: 0, accuracy: 85, effect: 'paralyze', emoji: '⚡', description: '電磁波でしびれさせる' },
  { id: 49, name: 'おにび', category: 'status', power: 0, accuracy: 80, effect: 'burn', emoji: '🔥', description: '鬼火で焼く' },
  { id: 50, name: 'あやしいひかり', category: 'status', power: 0, accuracy: 75, effect: 'confuse', emoji: '💫', description: '怪しい光で混乱させる' },
  { id: 51, name: 'さいみんじゅつ', category: 'status', power: 0, accuracy: 65, effect: 'sleep', emoji: '😵‍💫', description: '催眠術で眠らせる' },
  { id: 52, name: 'どくどくガス', category: 'status', power: 0, accuracy: 75, effect: 'poison', emoji: '💀', description: '猛毒のガスをまく' },
  { id: 53, name: 'やけどパウダー', category: 'status', power: 0, accuracy: 80, effect: 'burn', emoji: '🌶️', description: '粉でやけどさせる' },
  { id: 54, name: 'ビリビリタッチ', category: 'status', power: 0, accuracy: 85, effect: 'paralyze', emoji: '🫳', description: '触れてしびれさせる' },
  { id: 55, name: 'めまいのダンス', category: 'status', power: 0, accuracy: 75, effect: 'confuse', emoji: '💃', description: '踊って混乱させる' },
  { id: 56, name: 'ねむけのかぜ', category: 'status', power: 0, accuracy: 70, effect: 'sleep', emoji: '😴', description: '眠気を誘う風' },
  { id: 57, name: 'しびれごな', category: 'status', power: 0, accuracy: 80, effect: 'paralyze', emoji: '🌿', description: 'しびれる粉をまく' },
  { id: 58, name: 'きりのまい', category: 'status', power: 0, accuracy: 85, effect: 'confuse', emoji: '🌫️', description: '霧の中で混乱させる' },
  { id: 59, name: 'どくばり', category: 'status', power: 0, accuracy: 90, effect: 'poison', emoji: '🪡', description: '毒針で刺す' },
  { id: 60, name: 'いかりのほのお', category: 'status', power: 0, accuracy: 75, effect: 'burn', emoji: '😡', description: '怒りの炎で焼く' },
];

// =========================================
// 戦闘計算
// =========================================

/** キャラクターの「強さ」を計算 (進化時のcareScoreベース + 世代ボーナス) */
export function calculateStrength(stats: {
  discipline: number;
  care_miss_count: number;
  weight: number;
  base_weight: number;
  mini_game_total_score: number;
  mini_game_play_count: number;
  generation?: number;
  battleBonus?: number;
}): number {
  const careMiss = Math.max(0, 100 - (stats.care_miss_count || 0) * 10);
  const disc = stats.discipline || 0;
  const weightDiff = Math.max(0, 100 - Math.abs((stats.weight || 10) - (stats.base_weight || 10)) * 5);
  const avgGame = stats.mini_game_play_count > 0
    ? Math.min(100, ((stats.mini_game_total_score || 0) / stats.mini_game_play_count / 3) * 100)
    : 50;

  const base = Math.round(
    careMiss * 0.3 + disc * 0.25 + weightDiff * 0.15 + avgGame * 0.15 + 50 * 0.15
  );

  // 世代ボーナス: gene.battleBonus から引き継いだ値（最大15）
  const inheritedBonus = Math.min(15, Math.max(0, stats.battleBonus || 0));

  return Math.max(1, Math.min(100, base + inheritedBonus));
}

/** 技の出力を計算: 強さ × お腹% × なつき度(happiness)% */
export function calculateMoveDamage(
  move: BattleMove,
  strength: number,
  hungerPercent: number,
  happinessPercent: number,
): number {
  if (move.category === 'status') return 0;
  const base = move.power * (strength / 100) * (hungerPercent / 100) * (happinessPercent / 100);
  // ±15%のランダム幅
  const randomFactor = 0.85 + Math.random() * 0.3;
  return Math.max(1, Math.round(base * randomFactor));
}

/** 命中判定 */
export function doesMoveHit(accuracy: number): boolean {
  return Math.random() * 100 < accuracy;
}

/** 状態異常の追加効果判定 */
export function doesEffectProc(move: BattleMove): boolean {
  if (!move.effectChance) return false;
  return Math.random() * 100 < move.effectChance;
}

// =========================================
// バトラー（戦闘用キャラデータ）
// =========================================

export interface Battler {
  name: string;
  speciesName: string;
  imageKey: string;
  maxHp: number;
  hp: number;
  strength: number;
  hungerPercent: number;
  happinessPercent: number;
  moves: BattleMove[];
  statusEffect: StatusEffect | null;
  statusTurns: number;
}

/** キャラクターからバトラーを生成 */
export function createBattler(
  name: string,
  speciesName: string,
  imageKey: string,
  strength: number,
  hungerPercent: number,
  happinessPercent: number,
): Battler {
  const maxHp = 80 + strength * 2; // 82-280
  // ランダムに4技を選択
  const shuffled = [...ALL_MOVES].sort(() => Math.random() - 0.5);
  // 攻撃技3 + 状態異常技1のバランス
  const attacks = shuffled.filter(m => m.category === 'attack').slice(0, 3);
  const statuses = shuffled.filter(m => m.category === 'status').slice(0, 1);
  const moves = [...attacks, ...statuses];

  return {
    name,
    speciesName,
    imageKey,
    maxHp,
    hp: maxHp,
    strength,
    hungerPercent,
    happinessPercent,
    moves,
    statusEffect: null,
    statusTurns: 0,
  };
}

/** CPUバトラーを生成 */
export function createCpuBattler(difficulty: 'easy' | 'normal' | 'hard'): Battler {
  const cpuNames: Record<string, { name: string; species: string; imageKey: string }[]> = {
    easy: [
      { name: 'まるっち', species: 'まるっち', imageKey: 'kids_marucchi' },
      { name: 'くちたまっち', species: 'くちたまっち', imageKey: 'kids_kuchitamacchi' },
    ],
    normal: [
      { name: 'まるっち', species: 'まるっち', imageKey: 'young_marucchi' },
      { name: 'くちっち', species: 'くちっち', imageKey: 'young_kuchicchi' },
      { name: 'にじっち', species: 'にじっち', imageKey: 'young_nijicchi' },
    ],
    hard: [
      { name: 'まめっち', species: 'まめっち', imageKey: 'adult_mamecchi' },
      { name: 'めめっち', species: 'めめっち', imageKey: 'adult_memecchi' },
      { name: 'ひかりっち', species: 'ひかりっち', imageKey: 'adult_hikaricchi' },
    ],
  };

  const strengthRanges = { easy: [20, 40], normal: [40, 65], hard: [65, 90] };
  const range = strengthRanges[difficulty];
  const strength = range[0] + Math.floor(Math.random() * (range[1] - range[0]));

  const pool = cpuNames[difficulty];
  const pick = pool[Math.floor(Math.random() * pool.length)];

  return createBattler(
    pick.name,
    pick.species,
    pick.imageKey,
    strength,
    70 + Math.floor(Math.random() * 30), // 70-99
    70 + Math.floor(Math.random() * 30),
  );
}

/** CPUの技選択AI */
export function cpuSelectMove(battler: Battler, opponentHpPercent: number): BattleMove {
  // HPが低い相手には大技を狙う
  if (opponentHpPercent < 30) {
    const strongest = [...battler.moves]
      .filter(m => m.category === 'attack')
      .sort((a, b) => b.power - a.power);
    if (strongest.length > 0) return strongest[0];
  }
  // 状態異常がない相手には最初のターンに状態異常を狙う
  const statusMoves = battler.moves.filter(m => m.category === 'status');
  if (statusMoves.length > 0 && Math.random() < 0.3) {
    return statusMoves[0];
  }
  // ランダムに攻撃技を選ぶ
  const attacks = battler.moves.filter(m => m.category === 'attack');
  return attacks[Math.floor(Math.random() * attacks.length)] || battler.moves[0];
}

/** 状態異常のターン経過処理 */
export function processStatusEffect(battler: Battler): { damage: number; canAct: boolean; message: string } {
  if (!battler.statusEffect) return { damage: 0, canAct: true, message: '' };

  battler.statusTurns--;
  if (battler.statusTurns <= 0) {
    const old = battler.statusEffect;
    battler.statusEffect = null;
    return { damage: 0, canAct: true, message: `${battler.name}の${statusLabel(old)}が治った！` };
  }

  switch (battler.statusEffect) {
    case 'poison':
      const poisonDmg = Math.round(battler.maxHp * 0.08);
      battler.hp = Math.max(0, battler.hp - poisonDmg);
      return { damage: poisonDmg, canAct: true, message: `${battler.name}は毒でダメージ！(-${poisonDmg})` };
    case 'burn':
      const burnDmg = Math.round(battler.maxHp * 0.06);
      battler.hp = Math.max(0, battler.hp - burnDmg);
      return { damage: burnDmg, canAct: true, message: `${battler.name}はやけどでダメージ！(-${burnDmg})` };
    case 'paralyze':
      if (Math.random() < 0.3) {
        return { damage: 0, canAct: false, message: `${battler.name}はしびれて動けない！` };
      }
      return { damage: 0, canAct: true, message: '' };
    case 'confuse':
      if (Math.random() < 0.33) {
        const selfDmg = Math.round(battler.maxHp * 0.05);
        battler.hp = Math.max(0, battler.hp - selfDmg);
        return { damage: selfDmg, canAct: false, message: `${battler.name}は混乱して自分を攻撃！(-${selfDmg})` };
      }
      return { damage: 0, canAct: true, message: '' };
    case 'sleep':
      if (Math.random() < 0.33) {
        battler.statusEffect = null;
        return { damage: 0, canAct: true, message: `${battler.name}は目を覚ました！` };
      }
      return { damage: 0, canAct: false, message: `${battler.name}はぐっすり眠っている...` };
    default:
      return { damage: 0, canAct: true, message: '' };
  }
}

export function statusLabel(effect: StatusEffect | null): string {
  switch (effect) {
    case 'poison': return '毒';
    case 'burn': return 'やけど';
    case 'paralyze': return 'まひ';
    case 'confuse': return '混乱';
    case 'sleep': return '眠り';
    default: return '';
  }
}

export function statusEmoji(effect: StatusEffect | null): string {
  switch (effect) {
    case 'poison': return '☠️';
    case 'burn': return '🔥';
    case 'paralyze': return '⚡';
    case 'confuse': return '💫';
    case 'sleep': return '😴';
    default: return '';
  }
}
