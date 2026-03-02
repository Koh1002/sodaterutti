'use client';

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import {
  type Battler, type BattleMove,
  calculateMoveDamage, doesMoveHit, doesEffectProc,
  processStatusEffect, cpuSelectMove, statusLabel, statusEmoji,
} from '@/lib/battle-logic';

interface BattleScreenProps {
  player: Battler;
  opponent: Battler;
  onEnd: (won: boolean) => void;
}

type BattlePhase = 'select' | 'animating' | 'result';

interface LogEntry {
  text: string;
  isPlayer?: boolean;
}

export function BattleScreen({ player: initialPlayer, opponent: initialOpponent, onEnd }: BattleScreenProps) {
  const [player, setPlayer] = useState<Battler>({ ...initialPlayer });
  const [opponent, setOpponent] = useState<Battler>({ ...initialOpponent });
  const [phase, setPhase] = useState<BattlePhase>('select');
  const [log, setLog] = useState<LogEntry[]>([{ text: `${initialOpponent.name}が勝負を仕掛けてきた！` }]);
  const [effectEmoji, setEffectEmoji] = useState<{ emoji: string; target: 'player' | 'opponent' } | null>(null);
  const [winner, setWinner] = useState<'player' | 'opponent' | null>(null);
  const [turn, setTurn] = useState(1);

  const addLog = useCallback((entries: LogEntry[]) => {
    setLog(prev => [...prev, ...entries]);
  }, []);

  const showEffect = (emoji: string, target: 'player' | 'opponent') => {
    setEffectEmoji({ emoji, target });
    return new Promise<void>(resolve => setTimeout(() => {
      setEffectEmoji(null);
      resolve();
    }, 600));
  };

  const executeTurn = async (playerMove: BattleMove) => {
    setPhase('animating');
    const p = { ...player };
    const o = { ...opponent };
    const newLog: LogEntry[] = [];

    // プレイヤーの状態異常
    const pStatus = processStatusEffect(p);
    if (pStatus.message) newLog.push({ text: pStatus.message, isPlayer: true });

    // プレイヤーターン
    if (pStatus.canAct) {
      const hit = doesMoveHit(playerMove.accuracy);
      if (hit) {
        if (playerMove.category === 'attack') {
          const dmg = calculateMoveDamage(playerMove, p.strength, p.hungerPercent, p.happinessPercent);
          o.hp = Math.max(0, o.hp - dmg);
          newLog.push({ text: `${p.name}の${playerMove.name}！ ${dmg}ダメージ！`, isPlayer: true });
          await showEffect(playerMove.emoji, 'opponent');
          // 追加効果
          if (playerMove.effect && doesEffectProc(playerMove) && !o.statusEffect) {
            o.statusEffect = playerMove.effect;
            o.statusTurns = 2 + Math.floor(Math.random() * 3);
            newLog.push({ text: `${o.name}は${statusLabel(playerMove.effect)}になった！` });
          }
        } else {
          // 状態異常技
          if (playerMove.effect && !o.statusEffect) {
            o.statusEffect = playerMove.effect;
            o.statusTurns = 2 + Math.floor(Math.random() * 3);
            newLog.push({ text: `${p.name}の${playerMove.name}！ ${o.name}は${statusLabel(playerMove.effect)}になった！`, isPlayer: true });
            await showEffect(playerMove.emoji, 'opponent');
          } else if (o.statusEffect) {
            newLog.push({ text: `${p.name}の${playerMove.name}！ しかし効果がなかった...`, isPlayer: true });
          } else {
            newLog.push({ text: `${p.name}の${playerMove.name}！ しかし外れた！`, isPlayer: true });
          }
        }
      } else {
        newLog.push({ text: `${p.name}の${playerMove.name}！ しかし外れた！`, isPlayer: true });
      }
    }

    // KOチェック
    if (o.hp <= 0) {
      addLog(newLog);
      setPlayer(p);
      setOpponent(o);
      setWinner('player');
      setPhase('result');
      return;
    }

    // 相手の状態異常
    const oStatus = processStatusEffect(o);
    if (oStatus.message) newLog.push({ text: oStatus.message });

    // 相手ターン
    if (oStatus.canAct) {
      const cpuMove = cpuSelectMove(o, (p.hp / p.maxHp) * 100);
      const hit = doesMoveHit(cpuMove.accuracy);
      if (hit) {
        if (cpuMove.category === 'attack') {
          const dmg = calculateMoveDamage(cpuMove, o.strength, o.hungerPercent, o.happinessPercent);
          p.hp = Math.max(0, p.hp - dmg);
          newLog.push({ text: `${o.name}の${cpuMove.name}！ ${dmg}ダメージ！` });
          await showEffect(cpuMove.emoji, 'player');
          if (cpuMove.effect && doesEffectProc(cpuMove) && !p.statusEffect) {
            p.statusEffect = cpuMove.effect;
            p.statusTurns = 2 + Math.floor(Math.random() * 3);
            newLog.push({ text: `${p.name}は${statusLabel(cpuMove.effect)}になった！` });
          }
        } else {
          if (cpuMove.effect && !p.statusEffect) {
            p.statusEffect = cpuMove.effect;
            p.statusTurns = 2 + Math.floor(Math.random() * 3);
            newLog.push({ text: `${o.name}の${cpuMove.name}！ ${p.name}は${statusLabel(cpuMove.effect)}になった！` });
            await showEffect(cpuMove.emoji, 'player');
          } else {
            newLog.push({ text: `${o.name}の${cpuMove.name}！ しかし効果がなかった...` });
          }
        }
      } else {
        newLog.push({ text: `${o.name}の${cpuMove.name}！ しかし外れた！` });
      }
    }

    addLog(newLog);
    setPlayer(p);
    setOpponent(o);

    if (p.hp <= 0) {
      setWinner('opponent');
      setPhase('result');
    } else {
      setTurn(t => t + 1);
      setPhase('select');
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
      {/* ターン表示 */}
      <div className="text-center py-2 bg-black/20">
        <span className="text-white font-bold text-sm">Turn {turn}</span>
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

      {/* 技選択 or 結果 */}
      <div className="bg-white border-t-2 border-gray-200 px-4 py-3 pb-safe">
        {phase === 'select' && (
          <div className="grid grid-cols-2 gap-2 max-w-lg mx-auto">
            {player.moves.map((move) => (
              <button
                key={move.id}
                onClick={() => executeTurn(move)}
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
              {winner === 'player'
                ? 'ごほうびをゲット！'
                : 'また挑戦しよう！'}
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
