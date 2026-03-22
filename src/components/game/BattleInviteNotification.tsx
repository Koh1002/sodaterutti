'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import {
  type BattleInvite,
  subscribeToInvites, getPendingBattleInvites,
  acceptBattleInvite, cancelBattleSession,
} from '@/lib/realtime-battle-logic';
import { createSnapshot } from '@/lib/challenge-logic';
import { useGameStore } from '@/stores/game-store';
import type { RealtimeChannel } from '@supabase/supabase-js';

export function BattleInviteNotification() {
  const router = useRouter();
  const { character, species } = useGameStore();
  const [invite, setInvite] = useState<BattleInvite | null>(null);
  const [accepting, setAccepting] = useState(false);
  const channelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    let mounted = true;

    const setup = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      // Realtimeで招待を受信
      const channel = subscribeToInvites(user.id, (inv) => {
        if (mounted) setInvite(inv);
      });
      channelRef.current = channel;

      // 既存の待機中招待もポーリングで確認（初回 + 10秒おき）
      const checkInvites = async () => {
        const invites = await getPendingBattleInvites();
        if (invites.length > 0 && mounted) {
          setInvite(invites[0]);
        }
      };
      checkInvites();
      const interval = setInterval(checkInvites, 10000);

      return () => {
        clearInterval(interval);
        supabase.removeChannel(channel);
      };
    };

    const cleanup = setup();

    return () => {
      mounted = false;
      cleanup.then(fn => fn?.());
    };
  }, []);

  const handleAccept = async () => {
    if (!invite || !character || !species || accepting) return;
    setAccepting(true);

    const snapshot = createSnapshot(character, species);
    const ok = await acceptBattleInvite(invite.sessionId, snapshot);

    if (ok) {
      // バトルページへ遷移（リアルタイムモード）
      router.push(`/game/battle?realtime=${invite.sessionId}&role=guest`);
    }
    setInvite(null);
    setAccepting(false);
  };

  const handleDecline = async () => {
    if (!invite) return;
    await cancelBattleSession(invite.sessionId);
    setInvite(null);
  };

  return (
    <AnimatePresence>
      {invite && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ type: 'spring', damping: 20 }}
          className="fixed top-4 left-4 right-4 z-[100] max-w-md mx-auto"
        >
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border-2 border-red-300 overflow-hidden">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-red-500 to-orange-400 px-4 py-2 flex items-center gap-2">
              <span className="animate-pulse text-lg">⚔️</span>
              <span className="text-white font-bold text-sm">バトルの招待！</span>
              <span className="inline-block w-2 h-2 bg-white rounded-full ml-auto animate-pulse" />
              <span className="text-white/80 text-xs">LIVE</span>
            </div>

            {/* コンテンツ */}
            <div className="p-4">
              <p className="text-gray-800 font-bold text-base mb-1">
                {invite.hostName} からバトルの挑戦！
              </p>
              <p className="text-gray-500 text-xs mb-3">
                {invite.hostSnapshot.speciesName} (強さ: {invite.hostSnapshot.strength})
              </p>

              <div className="flex gap-2">
                <button
                  onClick={handleAccept}
                  disabled={accepting}
                  className="flex-1 py-3 bg-gradient-to-r from-red-500 to-orange-400 text-white font-bold rounded-xl text-sm hover:opacity-90 transition disabled:opacity-50"
                >
                  {accepting ? '接続中...' : '受けて立つ！'}
                </button>
                <button
                  onClick={handleDecline}
                  className="px-4 py-3 bg-gray-200 text-gray-600 font-bold rounded-xl text-sm hover:bg-gray-300 transition"
                >
                  辞退
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
