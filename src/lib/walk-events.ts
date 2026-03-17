/**
 * おさんぽ機能 - ランダムイベント定義
 */

export interface WalkEvent {
  id: string;
  title: string;
  description: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare';
  effects: {
    happiness?: number;
    hunger?: number;
    stamina?: number;
    weight?: number;
    cleanliness?: number;
  };
}

const WALK_EVENTS: WalkEvent[] = [
  // Common events (70%)
  {
    id: 'flower_field',
    title: 'お花畑を発見！',
    description: 'きれいなお花がたくさん咲いていたよ！',
    emoji: '🌸',
    rarity: 'common',
    effects: { happiness: 10 },
  },
  {
    id: 'butterfly',
    title: 'ちょうちょを追いかけた！',
    description: 'ひらひらとんでいく蝶々を追いかけて遊んだよ！',
    emoji: '🦋',
    rarity: 'common',
    effects: { happiness: 8, stamina: -5 },
  },
  {
    id: 'puddle',
    title: '水たまりでバシャバシャ！',
    description: '水たまりを見つけて楽しく遊んだ！でもちょっと汚れちゃった...',
    emoji: '💦',
    rarity: 'common',
    effects: { happiness: 12, cleanliness: -10 },
  },
  {
    id: 'nice_weather',
    title: 'ぽかぽか日和',
    description: 'おひさまが気持ちよかったよ！',
    emoji: '☀️',
    rarity: 'common',
    effects: { happiness: 5, stamina: -3 },
  },
  {
    id: 'found_leaf',
    title: 'きれいな葉っぱ',
    description: '色とりどりの落ち葉を集めたよ！',
    emoji: '🍂',
    rarity: 'common',
    effects: { happiness: 6 },
  },
  {
    id: 'bird_song',
    title: '小鳥のさえずり',
    description: '木の上で小鳥がきれいな声で歌ってた！',
    emoji: '🐦',
    rarity: 'common',
    effects: { happiness: 7 },
  },
  {
    id: 'exercise',
    title: 'いっぱい走った！',
    description: '元気いっぱいに走り回ったよ！',
    emoji: '🏃',
    rarity: 'common',
    effects: { happiness: 8, stamina: -10, weight: -2 },
  },
  {
    id: 'dandelion',
    title: 'たんぽぽのわたげ',
    description: 'ふーっと吹いて遊んだよ！',
    emoji: '🌬️',
    rarity: 'common',
    effects: { happiness: 5 },
  },
  // Uncommon events (25%)
  {
    id: 'found_fruit',
    title: '果物を見つけた！',
    description: '木になっている果物を見つけて食べたよ！おいしい！',
    emoji: '🍎',
    rarity: 'uncommon',
    effects: { happiness: 10, hunger: 15, weight: 1 },
  },
  {
    id: 'friend_meet',
    title: 'おともだちに会った！',
    description: '散歩中に友達に出会って一緒に遊んだよ！',
    emoji: '🤝',
    rarity: 'uncommon',
    effects: { happiness: 20, stamina: -8 },
  },
  {
    id: 'rain',
    title: '急な雨！',
    description: '突然雨が降ってきた！急いで帰ろう！',
    emoji: '🌧️',
    rarity: 'uncommon',
    effects: { happiness: -5, cleanliness: -15 },
  },
  {
    id: 'treasure',
    title: 'きらきら石を発見！',
    description: '地面にキラキラ光る石を見つけたよ！',
    emoji: '💎',
    rarity: 'uncommon',
    effects: { happiness: 15 },
  },
  {
    id: 'cat',
    title: 'ねこに出会った！',
    description: 'かわいい猫がいたよ！なでなでした！',
    emoji: '🐱',
    rarity: 'uncommon',
    effects: { happiness: 12 },
  },
  {
    id: 'hill_climb',
    title: '丘をのぼった！',
    description: '丘の上からの景色がとってもきれいだった！',
    emoji: '⛰️',
    rarity: 'uncommon',
    effects: { happiness: 15, stamina: -15, weight: -3 },
  },
  // Rare events (5%)
  {
    id: 'rainbow',
    title: '虹が出た！',
    description: '空に大きな虹がかかってた！すっごくきれい！',
    emoji: '🌈',
    rarity: 'rare',
    effects: { happiness: 30 },
  },
  {
    id: 'shooting_star',
    title: '流れ星！',
    description: '空に流れ星が！急いでお願い事をしたよ！',
    emoji: '🌠',
    rarity: 'rare',
    effects: { happiness: 30 },
  },
  {
    id: 'hot_spring',
    title: '温泉を発見！',
    description: 'ぽかぽかの温泉を見つけた！体がすっきり！',
    emoji: '♨️',
    rarity: 'rare',
    effects: { happiness: 25, stamina: 20, cleanliness: 30 },
  },
  {
    id: 'feast',
    title: 'ごちそう発見！',
    description: '森の中で不思議なごちそうを見つけた！',
    emoji: '🍱',
    rarity: 'rare',
    effects: { happiness: 20, hunger: 30, weight: 3 },
  },
];

/** おさんぽ中のランダムイベントを選択 */
export function getRandomWalkEvents(count: number = 3): WalkEvent[] {
  const events: WalkEvent[] = [];
  const available = [...WALK_EVENTS];

  for (let i = 0; i < count && available.length > 0; i++) {
    const roll = Math.random();
    let pool: WalkEvent[];

    if (roll < 0.05) {
      pool = available.filter(e => e.rarity === 'rare');
      // レアが枯渇したらアンコモンにフォールバック
      if (pool.length === 0) pool = available.filter(e => e.rarity === 'uncommon');
    } else if (roll < 0.30) {
      pool = available.filter(e => e.rarity === 'uncommon');
    } else {
      pool = available.filter(e => e.rarity === 'common');
    }

    // それでも空ならコモンにフォールバック
    if (pool.length === 0) pool = available.filter(e => e.rarity === 'common');
    if (pool.length === 0) pool = available;

    const idx = Math.floor(Math.random() * pool.length);
    const event = pool[idx];
    events.push(event);
    available.splice(available.indexOf(event), 1);
  }

  return events;
}

/** おさんぽの総合効果を計算 */
export function calculateWalkEffects(events: WalkEvent[]): Record<string, number> {
  const totals: Record<string, number> = {};

  for (const event of events) {
    for (const [key, value] of Object.entries(event.effects)) {
      totals[key] = (totals[key] || 0) + (value || 0);
    }
  }

  // 基本効果（散歩するだけで発生）
  totals.happiness = (totals.happiness || 0) + 5;
  totals.weight = (totals.weight || 0) - 1;
  totals.stamina = (totals.stamina || 0) - 5;

  return totals;
}

/** イベントにレアイベントが含まれているか */
export function hasRareEvent(events: WalkEvent[]): boolean {
  return events.some(e => e.rarity === 'rare');
}
