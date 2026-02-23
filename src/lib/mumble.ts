/**
 * キャラクターのつぶやき（状態・時間帯に応じたランダムメッセージ）
 */

import type { Database } from '@/types/database';

type Character = Database['public']['Tables']['characters']['Row'];

interface MumbleConfig {
  messages: string[];
  priority: number;
}

/** 状態に応じたつぶやきを返す */
export function getMumble(character: Character, hour: number): string | null {
  const configs: MumbleConfig[] = [];

  // 睡眠中
  if (character.is_sleeping) {
    configs.push({
      messages: ['zzz...', 'すやすや...', 'むにゃ...おにぎり...', 'zzz...zzz...'],
      priority: 10,
    });
    return pickRandom(configs[0].messages);
  }

  // 病気中（最優先）
  if (character.is_sick) {
    configs.push({
      messages: [
        'うぅ...くるしいよ...',
        'おくすりほしいな...',
        'きもちわるい...',
        'だれか...たすけて...',
      ],
      priority: 10,
    });
  }

  // おなかすいた
  if (character.hunger < 20) {
    configs.push({
      messages: [
        'おなかぺこぺこ...',
        'なにかたべたいなー',
        'ぐぅ〜...おなかなってる...',
        'ごはんまだかな...',
      ],
      priority: 8,
    });
  } else if (character.hunger > 80) {
    configs.push({
      messages: [
        'おなかいっぱい！しあわせ〜',
        'もうたべられないよ〜',
        'ごちそうさまでした！',
      ],
      priority: 3,
    });
  }

  // 幸福度
  if (character.happiness < 20) {
    configs.push({
      messages: [
        'つまんないなー...',
        'あそんでほしいな...',
        'さみしいよ...',
        'だれかかまってー...',
      ],
      priority: 8,
    });
  } else if (character.happiness > 80) {
    configs.push({
      messages: [
        'きょうもたのしいな！',
        'るんるん♪',
        'だいすき！',
        'いつもありがとう！',
      ],
      priority: 3,
    });
  }

  // 汚れ
  if (character.poop_count > 0) {
    configs.push({
      messages: [
        'くさい...そうじして...',
        'きたないよー！',
        'うぅ...くさいよ〜',
      ],
      priority: 7,
    });
  }

  // 体力
  if (character.stamina < 20) {
    configs.push({
      messages: [
        'つかれちゃった...',
        'ねむい...zzz',
        'もうあるけない...',
      ],
      priority: 6,
    });
  }

  // 時間帯
  if (hour >= 6 && hour < 9) {
    configs.push({
      messages: [
        'おはよう！きょうもいちにちがんばろ！',
        'あさだ！あさごはんたべたい！',
        'きもちいいあさだね〜',
      ],
      priority: 2,
    });
  } else if (hour >= 12 && hour < 14) {
    configs.push({
      messages: [
        'おひるだ！おなかすいたかも！',
        'ランチタイム♪',
        'おひるねしたいな〜',
      ],
      priority: 2,
    });
  } else if (hour >= 17 && hour < 20) {
    configs.push({
      messages: [
        'ゆうがただね〜',
        'きょうもいちにちおつかれさま！',
        'よるごはんなにかな？',
      ],
      priority: 2,
    });
  } else if (hour >= 21 || hour < 1) {
    configs.push({
      messages: [
        'もうねるじかんかな...',
        'ねむくなってきた...ふぁ〜',
        'おやすみなさい...',
      ],
      priority: 2,
    });
  }

  // 一般的なつぶやき（何も特別な状態でないとき用）
  configs.push({
    messages: [
      'ん〜...なにしようかな',
      'いいてんきだね！',
      'あそびたいなー！',
      'おさんぽいきたい！',
      'なにかたのしいことないかな〜',
      'ふんふふ〜ん♪',
      'ねえねえ、きいてきいて！',
      'きょうはなにをしようかな？',
      'ぼーっ...',
      'わくわく！',
    ],
    priority: 1,
  });

  // 優先度が高いものからランダム選択（完全ランダムではなく、優先度で重み付け）
  if (configs.length === 0) return null;

  const sorted = configs.sort((a, b) => b.priority - a.priority);
  // 80%の確率で最優先メッセージ、20%でランダム
  const selected = Math.random() < 0.8 ? sorted[0] : sorted[Math.floor(Math.random() * sorted.length)];
  return pickRandom(selected.messages);
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
