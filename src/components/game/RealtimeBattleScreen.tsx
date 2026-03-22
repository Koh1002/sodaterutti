'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import {
  type Battler, type BattleMove, type StatusEffect,
  calculateMoveDamage, doesMoveHit, doesEffectProc,
  processStatusEffect, statusLabel, statusEmoji,
} from '@/lib/battle-logic';
import {
  type BattleEvent, type TurnResult,
  broadcastBattleEvent, finishBattleSession,
} from '@/lib/realtime-battle-logic';
import type { ChallengerSnapshot } from '@/lib/challenge-logic';
import { GameInstructionPopup } from './GameInstructionPopup';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface RealtimeBattleScreenProps {
  sessionId: string;
  isHost: boolean;
  player: Battler;
  opponent: Battler;
  myUserId: string;
  opponentUserId: string;
  onEnd: (won: boolean) => void;
  /** ゲスト側のみ: チャンネル接続後にguest_joinedを送信するためのスナップショット */
  guestSnapshot?: ChallengerSnapshot;
}

type BattlePhase = 'select' | 'waiting' | 'animating' | 'result';

interface LogEntry {
  text: string;
  isPlayer?: boolean;
}

export function RealtimeBattleScreen({
  sessionId, isHost, player: initialPlayer, opponent: initialOpponent,
  myUserId, opponentUserId, onEnd, guestSnapshot,
}: RealtimeBattleScreenProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [player, setPlayer] = useState<Battler>({ ...initialPlayer });
  const [opponent, setOpponent] = useState<Battler>({ ...initialOpponent });
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [log, setLog] = useState<LogEntry[]>([{ text: 'リアルタイムバトル開始！' }]);
  const [effectEmoji] = useState<{ emoji: string; target: 'player' | 'opponent' } | null>(null);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [turn, setTurn] = useState(1);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const playerRef = useRef(player);
  const opponentRef = useRef(opponent);
  const turnRef = useRef(turn);
  const myMoveRef = useRef<BattleMove | null>(null);
  const opponentMoveIdRef = useRef<number | null>(null);

  playerRef.current = player;
  opponentRef.current = opponent;
  turnRef.current = turn;

  const addLog = useCallback((entries: LogEntry[]) => {
    setLog(prev => [...prev, ...entries]);
  }, []);

  // ホスト側: ターン計算（両者の技が揃ったら実行）
  const executeTurnAsHost = useCallback(async (
    hostMove: BattleMove, guestMoveId: number,
  ) => {
    const { ALL_MOVES } = await import('@/lib/battle-logic');
    const guestMove = ALL_MOVES.find(m => m.id === guestMoveId);
    if (!guestMove) return;

    // ホスト視点: player = host, opponent = guest
    const h = { ...playerRef.current };  // host battler
    const g = { ...opponentRef.current }; // guest battler

    const logs: string[] = [];

    // ホストの状態異常処理
    const hStatus = processStatusEffect(h);
    if (hStatus.message) logs.push(hStatus.message);

    // ホストの攻撃
    if (hStatus.canAct) {
      executeMoveInline(h, g, hostMove, logs);
    }

    // ゲストKOチェック
    let winnerSide: 'host' | 'guest' | undefined;
    if (g.hp <= 0) {
      logs.push(`${g.name}は倒れた！ ${h.name}の勝利！`);
      winnerSide = 'host';
    }

    if (!winnerSide) {
      // ゲストの状態異常処理
      const gStatus = processStatusEffect(g);
      if (gStatus.message) logs.push(gStatus.message);

      // ゲストの攻撃
      if (gStatus.canAct) {
        executeMoveInline(g, h, guestMove, logs);
      }

      // ホストKOチェック
      if (h.hp <= 0) {
        logs.push(`${h.name}は倒れた！ ${g.name}の勝利！`);
        winnerSide = 'guest';
      }
    }

    const result: TurnResult = {
      turn: turnRef.current,
      hostHp: h.hp,
      guestHp: g.hp,
      hostMaxHp: h.maxHp,
      guestMaxHp: g.maxHp,
      hostStatusEffect: h.statusEffect,
      hostStatusTurns: h.statusTurns,
      guestStatusEffect: g.statusEffect,
      guestStatusTurns: g.statusTurns,
      logs,
      winner: winnerSide,
    };

    // 結果をブロードキャスト
    if (channelRef.current) {
      broadcastBattleEvent(channelRef.current, { type: 'turn_result', result });
    }

    // ローカルに結果適用
    applyTurnResult(result);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ターン結果をUIに適用
  const applyTurnResult = useCallback(async (result: TurnResult) => {
    setPhase('animating');

    // ログをアニメーション付きで表示
    for (const logText of result.logs) {
      addLog([{ text: logText }]);
      await new Promise(r => setTimeout(r, 400));
    }

    // HPと状態を更新
    if (isHost) {
      setPlayer(prev => ({
        ...prev,
        hp: result.hostHp,
        maxHp: result.hostMaxHp,
        statusEffect: result.hostStatusEffect as StatusEffect | null,
        statusTurns: result.hostStatusTurns,
      }));
      setOpponent(prev => ({
        ...prev,
        hp: result.guestHp,
        maxHp: result.guestMaxHp,
        statusEffect: result.guestStatusEffect as StatusEffect | null,
        statusTurns: result.guestStatusTurns,
      }));
    } else {
      // ゲスト視点: player = guest, opponent = host
      setPlayer(prev => ({
        ...prev,
        hp: result.guestHp,
        maxHp: result.guestMaxHp,
        statusEffect: result.guestStatusEffect as StatusEffect | null,
        statusTurns: result.guestStatusTurns,
      }));
      setOpponent(prev => ({
        ...prev,
        hp: result.hostHp,
        maxHp: result.hostMaxHp,
        statusEffect: result.hostStatusEffect as StatusEffect | null,
        statusTurns: result.hostStatusTurns,
      }));
    }

    if (result.winner) {
      const iWon = (isHost && result.winner === 'host') || (!isHost && result.winner === 'guest');
      setWinner(iWon ? 'player' : 'opponent');
      setPhase('result');
      // セッション終了をDB更新
      const winnerId = result.winner === 'host' ? myUserId : opponentUserId;
      await finishBattleSession(sessionId, isHost ? winnerId : null);
    } else {
      setTurn(t => t + 1);
      setPhase('select');
      myMoveRef.current = null;
      opponentMoveIdRef.current = null;
    }
  }, [isHost, addLog, sessionId, myUserId, opponentUserId]);

  // Realtimeイベント処理
  useEffect(() => {
    const supabase = createClient();
    // 専用チャンネル名でバトル通信（battle pageの一時チャンネルと競合しない）
    const channel = supabase.channel(`battle-game:${sessionId}`, {
      config: { broadcast: { self: true } },
    });

    channel
      .on('broadcast', { event: 'battle_event' }, ({ payload }) => {
        const event = payload as BattleEvent;
        if (event.type === 'move_select') {
          if (event.playerId !== myUserId) {
            // 相手の技選択を受信
            if (isHost) {
              // ホスト: 相手の技を受け取り、自分のが既に選んであれば計算
              opponentMoveIdRef.current = event.moveId;
              if (myMoveRef.current) {
                executeTurnAsHost(myMoveRef.current, event.moveId);
              }
            }
            // ゲストは turn_result を待つだけ
          }
        } else if (event.type === 'turn_result') {
          if (!isHost) {
            // ゲスト: ホストからの結果を適用
            applyTurnResult(event.result);
          }
        } else if (event.type === 'battle_cancel') {
          addLog([{ text: '相手がバトルをキャンセルしました。' }]);
          setWinner('player');
          setPhase('result');
        }
      })
      .subscribe((status) => {
        // ゲスト側: チャンネル接続後にguest_joinedを通知
        if (status === 'SUBSCRIBED' && !isHost && guestSnapshot) {
          broadcastBattleEvent(channel, {
            type: 'guest_joined',
            guestSnapshot,
          });
        }
      });

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId, myUserId, isHost]);

  // プレイヤーの技選択
  const handleMoveSelect = (move: BattleMove) => {
    if (phase !== 'select') return;

    myMoveRef.current = move;
    setPhase('waiting');

    // 技選択をブロードキャスト
    if (channelRef.current) {
      broadcastBattleEvent(channelRef.current, {
        type: 'move_select',
        playerId: myUserId,
        moveId: move.id,
      });
    }

    // ホスト: 相手がすでに選んでいたらターン実行
    if (isHost && opponentMoveIdRef.current !== null) {
      executeTurnAsHost(move, opponentMoveIdRef.current);
    }
  };

  const hpPercent = (hp: number, max: number) => Math.max(0, Math.round((hp / max) * 100));
  const hpColor = (pct: number) => pct > 50 ? 'bg-green-400' : pct > 20 ? 'bg-yellow-400' : 'bg-red-400';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-sky-200 to-green-100 flex flex-col"
    >
      <GameInstructionPopup
        isOpen={showInstructions}
        title="フレンドバトル"
        emoji="⚔️"
        instructions={[
          '4つの技から1つ選んで攻撃しよう',
          '相手も同時に技を選んでいるよ',
          '攻撃技でダメージ、状態技で弱体化！',
          '相手のHPを0にしたら勝利！',
        ]}
        onStart={() => setShowInstructions(false)}
      />
      {/* ヘッダー */}
      <div className="text-center py-2 bg-black/20">
        <span className="text-white font-bold text-sm">Turn {turn}</span>
        <span className="text-white/70 text-xs ml-2">LIVE</span>
        <span className="inline-block w-2 h-2 bg-red-400 rounded-full ml-1 animate-pulse" />
      </div>

      {/* バトルフィールド */}
      <div className="flex-1 flex flex-col justify-between px-4 py-2 max-w-lg mx-auto w-full">
        {/* 相手側 */}
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-gray-800">{opponent.name}</span>
              <span className="text-xs text-gray-500">Lv.{opponent.strength}</span>
              {opponent.statusEffect && (
                <span className="text-xs bg-gray-200 px-1.5 rounded">
                  {statusEmoji(opponent.statusEffect)} {statusLabel(opponent.statusEffect)}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-300 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${hpColor(hpPercent(opponent.hp, opponent.maxHp))}`}
                style={{ width: `${hpPercent(opponent.hp, opponent.maxHp)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{opponent.hp}/{opponent.maxHp}</span>
          </div>
          <div className="relative w-20 h-20">
            <BattlerImage imageKey={opponent.imageKey} name={opponent.name} />
            <AnimatePresence>
              {effectEmoji?.target === 'opponent' && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center text-4xl"
                >
                  {effectEmoji.emoji}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* ログ */}
        <div className="bg-white/80 rounded-xl p-3 my-2 max-h-28 overflow-y-auto border border-gray-200">
          {log.slice(-4).map((entry, i) => (
            <p key={i} className={`text-xs leading-relaxed ${entry.isPlayer ? 'text-blue-700' : 'text-gray-700'}`}>
              {entry.text}
            </p>
          ))}
        </div>

        {/* プレイヤー側 */}
        <div className="flex items-end gap-3">
          <div className="relative w-24 h-24">
            <BattlerImage imageKey={player.imageKey} name={player.name} />
            <AnimatePresence>
              {effectEmoji?.target === 'player' && (
                <motion.span
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1.5, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center text-4xl"
                >
                  {effectEmoji.emoji}
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-bold text-sm text-gray-800">{player.name}</span>
              <span className="text-xs text-gray-500">強さ: {player.strength}</span>
              {player.statusEffect && (
                <span className="text-xs bg-gray-200 px-1.5 rounded">
                  {statusEmoji(player.statusEffect)} {statusLabel(player.statusEffect)}
                </span>
              )}
            </div>
            <div className="w-full bg-gray-300 rounded-full h-4 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${hpColor(hpPercent(player.hp, player.maxHp))}`}
                style={{ width: `${hpPercent(player.hp, player.maxHp)}%` }}
              />
            </div>
            <span className="text-xs text-gray-500">{player.hp}/{player.maxHp}</span>
          </div>
        </div>
      </div>

      {/* 技選択 / 待機 / 結果 */}
      <div className="bg-white border-t-2 border-gray-200 px-4 py-3 pb-safe">
        {phase === 'select' && (
          <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
            {player.moves.map((move) => (
              <button
                key={move.id}
                onClick={() => handleMoveSelect(move)}
                className="flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 active:scale-95 transition border border-blue-200 text-left"
              >
                <span className="text-lg">{move.emoji}</span>
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-bold text-gray-800 block truncate">{move.name}</span>
                  <span className="text-[10px] text-gray-500">
                    {move.category === 'attack' ? `威力${move.power}` : statusLabel(move.effect!)}
                    {' '}命中{move.accuracy}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}

        {phase === 'waiting' && (
          <div className="text-center py-4 max-w-lg mx-auto">
            <div className="inline-block animate-pulse text-2xl mb-2">🎯</div>
            <p className="text-sm text-gray-500">相手の技選択を待っています...</p>
          </div>
        )}

        {phase === 'animating' && (
          <div className="text-center py-4">
            <div className="inline-block animate-bounce text-2xl">⚔️</div>
          </div>
        )}

        {phase === 'result' && (
          <div className="text-center py-3 max-w-lg mx-auto">
            <p className="text-2xl font-bold mb-2">
              {winner === 'player' ? '🎉 勝利！' : '😢 敗北...'}
            </p>
            <p className="text-sm text-gray-500 mb-3">
              {winner === 'player' ? 'ごほうびをゲット！' : 'また挑戦しよう！'}
            </p>
            <button
              onClick={() => onEnd(winner === 'player')}
              className="px-8 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-xl shadow-md"
            >
              戻る
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}

/** 技実行ヘルパー (ホスト側のターン計算用、インライン) */
function executeMoveInline(attacker: Battler, defender: Battler, move: BattleMove, logs: string[]) {
  const hit = doesMoveHit(move.accuracy);
  if (!hit) {
    logs.push(`${attacker.name}の${move.name}！ しかし外れた！`);
    return;
  }
  if (move.category === 'attack') {
    const dmg = calculateMoveDamage(move, attacker.strength, attacker.hungerPercent, attacker.happinessPercent);
    defender.hp = Math.max(0, defender.hp - dmg);
    logs.push(`${attacker.name}の${move.name}！ ${dmg}ダメージ！`);
    if (move.effect && doesEffectProc(move) && !defender.statusEffect) {
      defender.statusEffect = move.effect;
      defender.statusTurns = 2 + Math.floor(Math.random() * 3);
      logs.push(`${defender.name}は${statusLabel(move.effect)}になった！`);
    }
  } else {
    if (move.effect && !defender.statusEffect) {
      defender.statusEffect = move.effect;
      defender.statusTurns = 2 + Math.floor(Math.random() * 3);
      logs.push(`${attacker.name}の${move.name}！ ${defender.name}は${statusLabel(move.effect)}になった！`);
    } else {
      logs.push(`${attacker.name}の${move.name}！ しかし効果がなかった...`);
    }
  }
}

function BattlerImage({ imageKey, name }: { imageKey: string; name: string }) {
  const [error, setError] = useState(false);
  const src = error ? getPlaceholderSvg(imageKey, 96) : getCharacterImagePath(imageKey);
  return (
    <Image
      src={src}
      alt={name}
      width={96}
      height={96}
      className="object-contain drop-shadow-md"
      onError={() => setError(true)}
    />
  );
}
