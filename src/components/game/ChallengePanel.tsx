'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  sendChallenge, getPendingChallenges, declineChallenge,
  createSnapshot,
  type PendingChallenge,
} from '@/lib/challenge-logic';
import { createBattler, type Battler } from '@/lib/battle-logic';
import { useGameStore } from '@/stores/game-store';

interface ChallengePanelProps {
  onClose: () => void;
  myCode: string;
  onStartBattle?: (player: Battler, opponent: Battler) => void;
}

export function ChallengePanel({ onClose, myCode, onStartBattle }: ChallengePanelProps) {
  const { character, species } = useGameStore();
  const [tab, setTab] = useState<'send' | 'inbox'>('inbox');
  const [friendCode, setFriendCode] = useState('');
  const [sendStatus, setSendStatus] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [challenges, setChallenges] = useState<PendingChallenge[]>([]);
  const [loadingChallenges, setLoadingChallenges] = useState(true);

  useEffect(() => {
    loadChallenges();
  }, []);

  const loadChallenges = async () => {
    setLoadingChallenges(true);
    const data = await getPendingChallenges();
    setChallenges(data);
    setLoadingChallenges(false);
  };

  const handleSend = async () => {
    if (!character || !species || sending) return;
    setSending(true);
    setSendStatus(null);
    const snapshot = createSnapshot(character, species);
    const result = await sendChallenge(friendCode, snapshot);
    if (result.success) {
      setSendStatus('チャレンジを送信しました！');
      setFriendCode('');
    } else {
      setSendStatus(result.error || '送信に失敗しました');
    }
    setSending(false);
  };

  const handleAccept = async (challenge: PendingChallenge) => {
    if (!character || !species || !onStartBattle) return;

    const mySnapshot = createSnapshot(character, species);
    const challSnap = challenge.snapshot;

    // 自分のバトラー
    const playerBattler = createBattler(
      mySnapshot.name, mySnapshot.speciesName, mySnapshot.imageKey,
      mySnapshot.strength, mySnapshot.hungerPercent, mySnapshot.happinessPercent,
    );
    // 相手のバトラー（CPUが操作）
    const opponentBattler = createBattler(
      challSnap.name, challSnap.speciesName, challSnap.imageKey,
      challSnap.strength, challSnap.hungerPercent, challSnap.happinessPercent,
    );

    // チャレンジのステータスを更新（accepted）
    const { createClient } = await import('@/lib/supabase/client');
    const supabase = createClient();
    await supabase.from('battle_challenges').update({
      status: 'accepted',
      opponent_snapshot: mySnapshot as unknown as import('@/types/database').Json,
    }).eq('id', challenge.id);

    // リストから削除
    setChallenges(prev => prev.filter(c => c.id !== challenge.id));

    // バトル画面を起動（CPUが相手キャラを操作）
    onStartBattle(playerBattler, opponentBattler);
  };

  const handleDecline = async (id: string) => {
    await declineChallenge(id);
    setChallenges(prev => prev.filter(c => c.id !== id));
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/50 flex items-end sm:items-center justify-center"
    >
      <motion.div
        initial={{ y: 300 }}
        animate={{ y: 0 }}
        exit={{ y: 300 }}
        className="bg-white rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md max-h-[85vh] overflow-hidden flex flex-col"
      >
        {/* ヘッダー */}
        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-3 flex items-center justify-between">
          <h2 className="text-white font-bold text-lg">📨 チャレンジバトル</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white text-xl font-bold">✕</button>
        </div>

        {/* タブ */}
        <div className="flex border-b">
          <button
            onClick={() => setTab('inbox')}
            className={`flex-1 py-3 text-sm font-bold transition ${tab === 'inbox' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
          >
            受信 {challenges.length > 0 && `(${challenges.length})`}
          </button>
          <button
            onClick={() => setTab('send')}
            className={`flex-1 py-3 text-sm font-bold transition ${tab === 'send' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-gray-400'}`}
          >
            送信
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {tab === 'send' && (
            <div className="space-y-4">
              <div className="bg-indigo-50 rounded-xl p-3 text-center">
                <p className="text-xs text-gray-500 mb-1">あなたのフレンドコード</p>
                <p className="text-xl font-bold text-indigo-600 tracking-widest">{myCode}</p>
              </div>

              <div>
                <p className="text-sm font-bold text-gray-600 mb-2">チャレンジを送る</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                    placeholder="フレンドコード"
                    maxLength={8}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-center font-bold tracking-wider uppercase"
                  />
                  <button
                    onClick={handleSend}
                    disabled={friendCode.length < 4 || sending}
                    className="px-5 py-2.5 bg-indigo-500 text-white font-bold rounded-xl hover:bg-indigo-600 transition disabled:opacity-50"
                  >
                    {sending ? '...' : '送信'}
                  </button>
                </div>
                {sendStatus && (
                  <p className={`text-sm mt-2 text-center ${sendStatus.includes('送信しました') ? 'text-green-600' : 'text-red-500'}`}>
                    {sendStatus}
                  </p>
                )}
              </div>

              <p className="text-xs text-gray-400 text-center">
                チャレンジを送ると、相手が好きなタイミングで受けて戦えます。相手のキャラをCPUが操作してバトルします！
              </p>
            </div>
          )}

          {tab === 'inbox' && (
            <div className="space-y-3">
              {loadingChallenges ? (
                <p className="text-center text-gray-400 py-8">読み込み中...</p>
              ) : challenges.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-4xl mb-2">📭</p>
                  <p className="text-gray-400">チャレンジはまだありません</p>
                  <button onClick={loadChallenges} className="mt-3 text-sm text-indigo-500 underline">
                    更新する
                  </button>
                </div>
              ) : (
                <>
                  <button onClick={loadChallenges} className="text-xs text-indigo-500 underline mb-2">
                    更新
                  </button>
                  {challenges.map((c) => (
                    <div key={c.id} className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-800">{c.challengerName}</p>
                          <p className="text-xs text-gray-400">
                            {c.snapshot.speciesName} (強さ: {c.snapshot.strength})
                          </p>
                        </div>
                        <p className="text-xs text-gray-400">
                          {new Date(c.createdAt).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleAccept(c)}
                          className="flex-1 py-2.5 bg-red-500 text-white font-bold rounded-xl text-sm hover:bg-red-600 transition"
                        >
                          受けて立つ！
                        </button>
                        <button
                          onClick={() => handleDecline(c.id)}
                          className="px-4 py-2.5 bg-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-300 transition"
                        >
                          辞退
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
