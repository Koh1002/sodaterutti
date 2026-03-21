'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import {
  createCoopRoom, joinCoopRoom,
  subscribeToRoom, broadcastEvent, updateRoomStatus,
  GAME_DURATION, TAP_SCORE,
  type CoopEvent,
} from '@/lib/coop-logic';

interface CoopGameScreenProps {
  onClose: () => void;
}

type Phase = 'menu' | 'waiting' | 'playing' | 'result';

export function CoopGameScreen({ onClose }: CoopGameScreenProps) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [roomId, setRoomId] = useState('');
  const [roomCode, setRoomCode] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [isHost, setIsHost] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [partnerScore, setPartnerScore] = useState(0);
  const [targetScore] = useState(50);
  const [timeLeft, setTimeLeft] = useState(GAME_DURATION);
  const [error, setError] = useState('');
  const [userId, setUserId] = useState('');
  const [tapEffects, setTapEffects] = useState<{ id: number; x: number; y: number }[]>([]);

  const channelRef = useRef<RealtimeChannel | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const effectIdRef = useRef(0);

  // ユーザーID取得
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        const supabase = createClient();
        supabase.removeChannel(channelRef.current);
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    let remaining = GAME_DURATION;
    timerRef.current = setInterval(() => {
      remaining--;
      setTimeLeft(remaining);
      if (remaining <= 0) {
        if (timerRef.current) clearInterval(timerRef.current);
        setPhase('result');
      }
    }, 1000);
  }, []);

  const handleEvent = useCallback((event: CoopEvent) => {
    if (event.type === 'tap') {
      if (event.playerId !== userId) {
        setPartnerScore(event.score);
      }
    } else if (event.type === 'start') {
      setPhase('playing');
      setTimeLeft(GAME_DURATION);
      setMyScore(0);
      setPartnerScore(0);
      startTimer();
    } else if (event.type === 'finish') {
      setPhase('result');
      if (timerRef.current) clearInterval(timerRef.current);
      if (isHost) {
        setMyScore(event.hostScore);
        setPartnerScore(event.guestScore);
      } else {
        setMyScore(event.guestScore);
        setPartnerScore(event.hostScore);
      }
    }
  }, [userId, isHost, startTimer]);

  // ルーム作成
  const handleCreate = async () => {
    const result = await createCoopRoom();
    if (!result) { setError('ルーム作成に失敗しました'); return; }
    setRoomId(result.roomId);
    setRoomCode(result.roomCode);
    setIsHost(true);
    setPhase('waiting');

    // Realtimeに接続
    const channel = subscribeToRoom(result.roomId, handleEvent);
    channelRef.current = channel;

    // ゲスト参加を監視
    const supabase = createClient();
    const pollInterval = setInterval(async () => {
      const { data } = await supabase.from('coop_rooms').select('guest_id').eq('id', result.roomId).single();
      if (data?.guest_id) {
        clearInterval(pollInterval);
        // ゲスト参加 → ゲーム開始
        await updateRoomStatus(result.roomId, 'playing');
        broadcastEvent(channel, { type: 'start' });
      }
    }, 2000);

    // 60秒でタイムアウト
    setTimeout(() => clearInterval(pollInterval), 60000);
  };

  // ルーム参加
  const handleJoin = async () => {
    const code = joinCode.toUpperCase().trim();
    if (code.length < 4) { setError('コードを入力してください'); return; }

    const result = await joinCoopRoom(code);
    if (!result) { setError('ルームが見つかりません'); return; }

    setRoomId(result.roomId);
    setRoomCode(code);
    setIsHost(false);
    setPhase('waiting');

    // Realtimeに接続
    const channel = subscribeToRoom(result.roomId, handleEvent);
    channelRef.current = channel;
  };

  // タップ処理
  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    if (phase !== 'playing') return;

    const newScore = myScore + TAP_SCORE;
    setMyScore(newScore);

    // タップエフェクト
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    let x: number, y: number;
    if ('touches' in e) {
      x = e.touches[0].clientX - rect.left;
      y = e.touches[0].clientY - rect.top;
    } else {
      x = e.clientX - rect.left;
      y = e.clientY - rect.top;
    }
    const id = ++effectIdRef.current;
    setTapEffects(prev => [...prev, { id, x, y }]);
    setTimeout(() => setTapEffects(prev => prev.filter(e => e.id !== id)), 500);

    // ブロードキャスト
    if (channelRef.current) {
      broadcastEvent(channelRef.current, {
        type: 'tap',
        playerId: userId,
        score: newScore,
      });
    }
  };

  // ゲーム終了処理
  useEffect(() => {
    if (phase === 'result' && channelRef.current && isHost) {
      const hostFinal = isHost ? myScore : partnerScore;
      const guestFinal = isHost ? partnerScore : myScore;
      broadcastEvent(channelRef.current, {
        type: 'finish',
        hostScore: hostFinal,
        guestScore: guestFinal,
      });
      updateRoomStatus(roomId, 'finished', { hostScore: hostFinal, guestScore: guestFinal });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const totalScore = myScore + partnerScore;
  const isSuccess = totalScore >= targetScore;
  const progressPercent = Math.min(100, Math.round((totalScore / targetScore) * 100));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-gradient-to-b from-cyan-100 to-blue-200 flex flex-col"
    >
      {/* ヘッダー */}
      <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-3 flex items-center justify-between shadow-lg">
        <button onClick={onClose} className="text-white font-bold">← 戻る</button>
        <h1 className="text-white font-bold text-lg">🧹 おそうじリレー</h1>
        <div className="w-10" />
      </div>

      <main className="flex-1 flex flex-col items-center justify-center max-w-lg mx-auto w-full px-4">
        {/* メニュー */}
        {phase === 'menu' && (
          <div className="w-full space-y-4">
            <div className="text-center mb-6">
              <p className="text-6xl mb-3">🧹</p>
              <h2 className="text-xl font-bold text-gray-800">おそうじリレー</h2>
              <p className="text-sm text-gray-500 mt-1">
                2人で協力してタップ！{GAME_DURATION}秒以内に{targetScore}回お掃除しよう！
              </p>
            </div>

            <button
              onClick={handleCreate}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-blue-400 text-white font-bold rounded-2xl shadow-lg text-base"
            >
              ルームを作る
            </button>

            <div className="bg-white/80 rounded-2xl p-4 shadow-sm">
              <p className="text-sm font-bold text-gray-600 mb-2">ルームに参加</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                  placeholder="ルームコード"
                  maxLength={6}
                  className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-center font-bold tracking-wider uppercase"
                />
                <button
                  onClick={handleJoin}
                  className="px-5 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition"
                >
                  参加
                </button>
              </div>
            </div>

            {error && <p className="text-red-500 text-sm text-center">{error}</p>}
          </div>
        )}

        {/* 待機中 */}
        {phase === 'waiting' && (
          <div className="text-center space-y-6">
            <div className="animate-bounce text-6xl">🧹</div>
            {isHost ? (
              <>
                <div>
                  <p className="text-gray-600 font-bold mb-2">ルームコードを友達に教えよう！</p>
                  <p className="text-4xl font-bold text-blue-600 tracking-widest bg-white/80 rounded-xl py-4 px-8">
                    {roomCode}
                  </p>
                </div>
                <p className="text-gray-400 text-sm animate-pulse">相手の参加を待っています...</p>
              </>
            ) : (
              <p className="text-gray-400 text-sm animate-pulse">ゲーム開始を待っています...</p>
            )}
          </div>
        )}

        {/* プレイ中 */}
        {phase === 'playing' && (
          <div className="w-full flex flex-col items-center gap-4">
            {/* タイマー */}
            <div className={`text-5xl font-bold ${timeLeft <= 5 ? 'text-red-500 animate-pulse' : 'text-gray-800'}`}>
              {timeLeft}
            </div>

            {/* 進捗バー */}
            <div className="w-full bg-white/50 rounded-full h-6 overflow-hidden border-2 border-white">
              <motion.div
                className={`h-full rounded-full ${isSuccess ? 'bg-green-400' : 'bg-cyan-400'}`}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.2 }}
              />
            </div>
            <p className="text-sm font-bold text-gray-600">
              {totalScore} / {targetScore}
            </p>

            {/* スコア表示 */}
            <div className="flex gap-8 mb-2">
              <div className="text-center">
                <p className="text-xs text-gray-500">あなた</p>
                <p className="text-2xl font-bold text-blue-600">{myScore}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">パートナー</p>
                <p className="text-2xl font-bold text-purple-600">{partnerScore}</p>
              </div>
            </div>

            {/* タップエリア */}
            <div
              onClick={handleTap}
              onTouchStart={handleTap}
              className="relative w-full aspect-square max-w-xs bg-white/60 rounded-3xl border-4 border-dashed border-cyan-300 flex items-center justify-center cursor-pointer active:scale-95 transition select-none overflow-hidden"
            >
              <div className="text-center">
                <p className="text-7xl">🧹</p>
                <p className="text-gray-400 text-sm mt-2 font-bold">タップでお掃除！</p>
              </div>
              {/* タップエフェクト */}
              <AnimatePresence>
                {tapEffects.map(({ id, x, y }) => (
                  <motion.span
                    key={id}
                    initial={{ opacity: 1, scale: 0.5, x: x - 15, y: y - 15 }}
                    animate={{ opacity: 0, scale: 1.5, y: y - 50 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="absolute text-2xl pointer-events-none"
                    style={{ left: 0, top: 0 }}
                  >
                    ✨
                  </motion.span>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}

        {/* 結果 */}
        {phase === 'result' && (
          <div className="text-center space-y-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.8 }}
              className="text-7xl"
            >
              {isSuccess ? '🎉' : '😅'}
            </motion.div>
            <h2 className="text-2xl font-bold text-gray-800">
              {isSuccess ? 'ピカピカになった！' : 'もうちょっとだった...'}
            </h2>
            <div className="bg-white/80 rounded-2xl p-6 space-y-3">
              <p className="text-lg font-bold text-gray-700">
                合計スコア: <span className="text-cyan-600">{totalScore}</span> / {targetScore}
              </p>
              <div className="flex justify-center gap-8">
                <div className="text-center">
                  <p className="text-xs text-gray-500">あなた</p>
                  <p className="text-xl font-bold text-blue-600">{myScore}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-500">パートナー</p>
                  <p className="text-xl font-bold text-purple-600">{partnerScore}</p>
                </div>
              </div>
              {isSuccess && (
                <p className="text-sm text-green-600 font-bold">
                  ボーナス: 清潔さ +20!
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold rounded-xl shadow-lg"
            >
              戻る
            </button>
          </div>
        )}
      </main>
    </motion.div>
  );
}
