/**
 * 同期型協力ゲーム: Supabase Realtime を使った「おそうじリレー」
 *
 * ゲーム内容:
 * - 2人で協力して制限時間内にターゲットスコアに到達する
 * - 交互にタップする番が切り替わる（ランダムスパン）
 * - 自分の番でないときにタップしてもカウントされない
 * - Realtime Broadcast でスコア・ターン切り替えを即時同期
 */

import { createClient } from '@/lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export interface CoopGameState {
  roomId: string;
  hostScore: number;
  guestScore: number;
  targetScore: number;
  timeLeft: number;
  status: 'waiting' | 'playing' | 'finished';
  isHost: boolean;
  partnerId?: string;
}

export type CoopEvent =
  | { type: 'tap'; playerId: string; score: number }
  | { type: 'ready'; playerId: string }
  | { type: 'start' }
  | { type: 'turn_switch'; activeRole: 'host' | 'guest'; nextSwitchIn: number }
  | { type: 'finish'; hostScore: number; guestScore: number };

const GAME_DURATION = 20; // 秒
const TAP_SCORE = 1;

/** ターン切り替えの最小/最大スパン（ミリ秒） */
const MIN_TURN_DURATION = 1500;  // 1.5秒 - すぐ切り替わる
const MAX_TURN_DURATION = 5000;  // 5秒 - なかなか切り替わらない

/** ランダムなターン持続時間を生成 */
export function getRandomTurnDuration(): number {
  return MIN_TURN_DURATION + Math.random() * (MAX_TURN_DURATION - MIN_TURN_DURATION);
}

/** 6桁のルームコードを生成 */
function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

/** ルームを作成 */
export async function createCoopRoom(): Promise<{ roomId: string; roomCode: string } | null> {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const roomCode = generateRoomCode();
  const { data, error } = await supabase.from('coop_rooms').insert({
    host_id: user.id,
    room_code: roomCode,
    game_type: 'cleaning_relay',
    target_score: 50,
  }).select('id').single();

  if (error || !data) return null;
  return { roomId: data.id, roomCode };
}

/** ルームに参加 */
export async function joinCoopRoom(code: string): Promise<{ roomId: string; hostId: string; targetScore: number } | null> {
  const supabase = createClient();
  const { data } = await supabase.rpc('join_coop_room', { code: code.toUpperCase() });
  if (!data || data.length === 0) return null;
  const room = data[0];
  return { roomId: room.room_id, hostId: room.room_host_id, targetScore: room.room_target_score };
}

/** Realtime チャンネルを購読 */
export function subscribeToRoom(
  roomId: string,
  onEvent: (event: CoopEvent) => void,
): RealtimeChannel {
  const supabase = createClient();
  const channel = supabase.channel(`coop:${roomId}`, {
    config: { broadcast: { self: true } },
  });

  channel
    .on('broadcast', { event: 'coop_event' }, ({ payload }) => {
      onEvent(payload as CoopEvent);
    })
    .subscribe();

  return channel;
}

/** イベントをブロードキャスト */
export function broadcastEvent(channel: RealtimeChannel, event: CoopEvent) {
  channel.send({
    type: 'broadcast',
    event: 'coop_event',
    payload: event,
  });
}

/** ルームのステータスを更新 */
export async function updateRoomStatus(roomId: string, status: 'playing' | 'finished', scores?: { hostScore: number; guestScore: number }) {
  const supabase = createClient();
  const update: Record<string, unknown> = { status };
  if (status === 'playing') update.started_at = new Date().toISOString();
  if (status === 'finished') {
    update.finished_at = new Date().toISOString();
    if (scores) {
      update.host_score = scores.hostScore;
      update.guest_score = scores.guestScore;
    }
  }
  await supabase.from('coop_rooms').update(update).eq('id', roomId);
}

export { GAME_DURATION, TAP_SCORE };
