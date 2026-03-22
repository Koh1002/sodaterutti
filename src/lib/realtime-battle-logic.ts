/**
 * リアルタイムフレンド対戦: Supabase Realtime Broadcast でターン同期
 *
 * アーキテクチャ: ホスト権威型
 * - 両者が技を選択 → ブロードキャスト
 * - ホストが両者の技を受け取り、ターン計算 → 結果をブロードキャスト
 * - ゲストは結果を受け取ってUIを更新
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Json } from '@/types/database';
import type { ChallengerSnapshot } from '@/lib/challenge-logic';

// =========================================
// セッション管理
// =========================================

/** バトル招待を送信（ホスト側） */
export async function createBattleInvite(
  friendCode: string,
  snapshot: ChallengerSnapshot,
): Promise<{ sessionId: string } | { error: string }> {
  const supabase = createClient();
  const code = friendCode.toLowerCase().replace(/[^a-f0-9]/g, '');
  if (code.length < 4) return { error: '4文字以上入力してください' };

  const { data, error } = await supabase.rpc('create_battle_invite', {
    opponent_friend_code: code,
    snapshot: snapshot as unknown as Json,
  });

  if (error) {
    if (error.message.includes('フレンド')) return { error: error.message };
    if (error.message.includes('自分')) return { error: error.message };
    return { error: 'バトル招待の送信に失敗しました' };
  }
  return { sessionId: data as string };
}

/** 自分宛のバトル招待を取得（ゲスト側） */
export async function getPendingBattleInvites(): Promise<BattleInvite[]> {
  const supabase = createClient();
  const { data } = await supabase.rpc('get_pending_battle_invites');
  if (!data) return [];
  return data.map((d) => ({
    sessionId: d.session_id,
    hostId: d.host_user_id,
    hostName: d.host_name || '???',
    hostSnapshot: d.host_snapshot as unknown as ChallengerSnapshot,
    createdAt: d.session_created_at,
  }));
}

export interface BattleInvite {
  sessionId: string;
  hostId: string;
  hostName: string;
  hostSnapshot: ChallengerSnapshot;
  createdAt: string;
}

/** バトル招待を受諾（ゲスト側） */
export async function acceptBattleInvite(
  sessionId: string,
  snapshot: ChallengerSnapshot,
): Promise<boolean> {
  const supabase = createClient();
  const { data } = await supabase.rpc('accept_battle_invite', {
    p_session_id: sessionId,
    snapshot: snapshot as unknown as Json,
  });
  return !!data;
}

/** バトル招待を辞退/キャンセル */
export async function cancelBattleSession(sessionId: string) {
  const supabase = createClient();
  await supabase.from('battle_sessions').update({ status: 'cancelled' }).eq('id', sessionId);
}

/** バトルセッション終了 */
export async function finishBattleSession(sessionId: string, winnerId: string | null) {
  const supabase = createClient();
  await supabase.from('battle_sessions').update({
    status: 'finished',
    winner_id: winnerId,
    finished_at: new Date().toISOString(),
  }).eq('id', sessionId);
}

// =========================================
// Realtime Broadcast（ターン同期）
// =========================================

export type BattleEvent =
  | { type: 'move_select'; playerId: string; moveId: number }
  | { type: 'turn_result'; result: TurnResult }
  | { type: 'guest_joined'; guestSnapshot: ChallengerSnapshot }
  | { type: 'battle_cancel' };

export interface TurnResult {
  turn: number;
  hostHp: number;
  guestHp: number;
  hostMaxHp: number;
  guestMaxHp: number;
  hostStatusEffect: string | null;
  hostStatusTurns: number;
  guestStatusEffect: string | null;
  guestStatusTurns: number;
  logs: string[];
  winner?: 'host' | 'guest';
}

/** バトルチャンネルを購読 */
export function subscribeToBattle(
  sessionId: string,
  onEvent: (event: BattleEvent) => void,
): RealtimeChannel {
  const supabase = createClient();
  const channel = supabase.channel(`battle:${sessionId}`, {
    config: { broadcast: { self: true } },
  });

  channel
    .on('broadcast', { event: 'battle_event' }, ({ payload }) => {
      onEvent(payload as BattleEvent);
    })
    .subscribe();

  return channel;
}

/** バトルイベントをブロードキャスト */
export function broadcastBattleEvent(channel: RealtimeChannel, event: BattleEvent) {
  channel.send({
    type: 'broadcast',
    event: 'battle_event',
    payload: event,
  });
}

// =========================================
// フレンド対戦の通知チャンネル
// =========================================

/** 自分宛のバトル招待通知を購読 */
export function subscribeToInvites(
  userId: string,
  onInvite: (invite: BattleInvite) => void,
): RealtimeChannel {
  const supabase = createClient();
  const channel = supabase.channel(`battle-invite:${userId}`);

  channel
    .on('broadcast', { event: 'invite' }, ({ payload }) => {
      onInvite(payload as BattleInvite);
    })
    .subscribe();

  return channel;
}

/** 招待通知を相手に送信 */
export function notifyInvite(guestUserId: string, invite: BattleInvite) {
  const supabase = createClient();
  const channel = supabase.channel(`battle-invite:${guestUserId}`);
  channel.subscribe((status) => {
    if (status === 'SUBSCRIBED') {
      channel.send({
        type: 'broadcast',
        event: 'invite',
        payload: invite,
      });
      // 少し待ってからチャンネルを閉じる
      setTimeout(() => {
        supabase.removeChannel(channel);
      }, 2000);
    }
  });
}
