/**
 * 非同期バトルチャレンジ: 送信・受諾・解決ロジック
 */

import { createClient } from '@/lib/supabase/client';
import {
  calculateStrength, createBattler, cpuSelectMove,
  calculateMoveDamage, doesMoveHit, doesEffectProc,
  processStatusEffect, statusLabel,
  type Battler, type BattleMove,
} from '@/lib/battle-logic';
import type { Json } from '@/types/database';

/** チャレンジ用キャラスナップショット */
export interface ChallengerSnapshot {
  name: string;
  speciesName: string;
  imageKey: string;
  strength: number;
  hungerPercent: number;
  happinessPercent: number;
}

/** チャレンジ一覧の1件 */
export interface PendingChallenge {
  id: string;
  challengerName: string;
  snapshot: ChallengerSnapshot;
  createdAt: string;
}

/** 自分のキャラのスナップショットを作成 */
export function createSnapshot(
  character: { name: string; hunger: number; happiness: number; discipline: number; care_miss_count: number; weight: number; mini_game_total_score: number; mini_game_play_count: number },
  species: { name: string; image_key: string; base_weight: number },
): ChallengerSnapshot {
  const strength = calculateStrength({
    discipline: character.discipline,
    care_miss_count: character.care_miss_count,
    weight: character.weight,
    base_weight: species.base_weight,
    mini_game_total_score: character.mini_game_total_score,
    mini_game_play_count: character.mini_game_play_count,
  });
  return {
    name: character.name || species.name,
    speciesName: species.name,
    imageKey: species.image_key,
    strength,
    hungerPercent: character.hunger,
    happinessPercent: character.happiness,
  };
}

/** チャレンジを送信 */
export async function sendChallenge(friendCode: string, snapshot: ChallengerSnapshot): Promise<{ success: boolean; error?: string }> {
  const supabase = createClient();
  const code = friendCode.toLowerCase().replace(/[^a-f0-9]/g, '');
  if (code.length < 4) return { success: false, error: '4文字以上入力してください' };

  const { error } = await supabase.rpc('send_battle_challenge', {
    opponent_friend_code: code,
    snapshot: snapshot as unknown as Json,
  });

  if (error) {
    return { success: false, error: error.message.includes('フレンド') ? error.message : 'チャレンジ送信に失敗しました' };
  }
  return { success: true };
}

/** 受信チャレンジ一覧を取得 */
export async function getPendingChallenges(): Promise<PendingChallenge[]> {
  const supabase = createClient();
  const { data } = await supabase.rpc('get_pending_challenges');
  if (!data) return [];

  return data.map((c) => ({
    id: c.challenge_id,
    challengerName: c.challenger_name || '???',
    snapshot: c.challenger_snapshot as unknown as ChallengerSnapshot,
    createdAt: c.challenge_created_at,
  }));
}

/** チャレンジを辞退 */
export async function declineChallenge(challengeId: string) {
  const supabase = createClient();
  await supabase.from('battle_challenges').update({ status: 'declined' }).eq('id', challengeId);
}

/** チャレンジを受諾してバトルをシミュレート */
export async function acceptAndResolveBattle(
  challengeId: string,
  mySnapshot: ChallengerSnapshot,
): Promise<{ won: boolean; log: string[] }> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { won: false, log: ['認証エラー'] };

  // チャレンジのデータ取得
  const { data: challenges } = await supabase
    .from('battle_challenges')
    .select('*')
    .eq('id', challengeId)
    .eq('status', 'pending')
    .limit(1);

  if (!challenges || challenges.length === 0) return { won: false, log: ['チャレンジが見つかりません'] };
  const challenge = challenges[0];
  const challengerSnap = challenge.challenger_snapshot as unknown as ChallengerSnapshot;

  // バトラー生成
  const me = createBattler(mySnapshot.name, mySnapshot.speciesName, mySnapshot.imageKey, mySnapshot.strength, mySnapshot.hungerPercent, mySnapshot.happinessPercent);
  const opp = createBattler(challengerSnap.name, challengerSnap.speciesName, challengerSnap.imageKey, challengerSnap.strength, challengerSnap.hungerPercent, challengerSnap.happinessPercent);

  // 自動バトルシミュレーション（最大30ターン）
  const battleLog: string[] = [];
  for (let turn = 1; turn <= 30; turn++) {
    // プレイヤー（受諾者）ターン
    const pStatus = processStatusEffect(me);
    if (pStatus.message) battleLog.push(pStatus.message);
    if (pStatus.canAct) {
      const move = cpuSelectMove(me, (opp.hp / opp.maxHp) * 100);
      executeMove(me, opp, move, battleLog);
    }
    if (opp.hp <= 0) {
      battleLog.push(`${opp.name}は倒れた！ ${me.name}の勝利！`);
      await resolveChallenge(supabase, challengeId, user.id, mySnapshot, battleLog);
      return { won: true, log: battleLog };
    }

    // チャレンジャーターン
    const oStatus = processStatusEffect(opp);
    if (oStatus.message) battleLog.push(oStatus.message);
    if (oStatus.canAct) {
      const move = cpuSelectMove(opp, (me.hp / me.maxHp) * 100);
      executeMove(opp, me, move, battleLog);
    }
    if (me.hp <= 0) {
      battleLog.push(`${me.name}は倒れた！ ${opp.name}の勝利！`);
      await resolveChallenge(supabase, challengeId, challenge.challenger_id, mySnapshot, battleLog);
      return { won: false, log: battleLog };
    }
  }

  // 30ターン経過 - HP割合で判定
  const myPercent = me.hp / me.maxHp;
  const oppPercent = opp.hp / opp.maxHp;
  const won = myPercent >= oppPercent;
  battleLog.push(`時間切れ！ ${won ? me.name : opp.name}の判定勝ち！`);
  await resolveChallenge(supabase, challengeId, won ? user.id : challenge.challenger_id, mySnapshot, battleLog);
  return { won, log: battleLog };
}

function executeMove(attacker: Battler, defender: Battler, move: BattleMove, log: string[]) {
  const hit = doesMoveHit(move.accuracy);
  if (!hit) {
    log.push(`${attacker.name}の${move.name}！ しかし外れた！`);
    return;
  }
  if (move.category === 'attack') {
    const dmg = calculateMoveDamage(move, attacker.strength, attacker.hungerPercent, attacker.happinessPercent);
    defender.hp = Math.max(0, defender.hp - dmg);
    log.push(`${attacker.name}の${move.name}！ ${dmg}ダメージ！`);
    if (move.effect && doesEffectProc(move) && !defender.statusEffect) {
      defender.statusEffect = move.effect;
      defender.statusTurns = 2 + Math.floor(Math.random() * 3);
      log.push(`${defender.name}は${statusLabel(move.effect)}になった！`);
    }
  } else {
    if (move.effect && !defender.statusEffect) {
      defender.statusEffect = move.effect;
      defender.statusTurns = 2 + Math.floor(Math.random() * 3);
      log.push(`${attacker.name}の${move.name}！ ${defender.name}は${statusLabel(move.effect)}になった！`);
    } else {
      log.push(`${attacker.name}の${move.name}！ しかし効果がなかった...`);
    }
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function resolveChallenge(supabase: any, challengeId: string, winnerId: string, opponentSnapshot: ChallengerSnapshot, battleLog: string[]) {
  await supabase.from('battle_challenges').update({
    status: 'resolved',
    winner_id: winnerId,
    opponent_snapshot: opponentSnapshot,
    battle_log: battleLog,
    resolved_at: new Date().toISOString(),
  }).eq('id', challengeId);
}
