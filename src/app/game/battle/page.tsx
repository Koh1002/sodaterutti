'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import { useGameStore } from '@/stores/game-store';
import { BattleScreen } from '@/components/game/BattleScreen';
import { RealtimeBattleScreen } from '@/components/game/RealtimeBattleScreen';
import { ChallengePanel } from '@/components/game/ChallengePanel';
import { CoopGameScreen } from '@/components/game/CoopGameScreen';
import {
  calculateStrength, createBattler, createCpuBattler,
  type Battler,
} from '@/lib/battle-logic';
import { createSnapshot, type ChallengerSnapshot } from '@/lib/challenge-logic';
import {
  createBattleInvite, notifyInvite,
  subscribeToBattle, type BattleEvent,
} from '@/lib/realtime-battle-logic';
import { getPendingChallenges } from '@/lib/challenge-logic';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import type { Database } from '@/types/database';
import type { RealtimeChannel } from '@supabase/supabase-js';

type Species = Database['public']['Tables']['species']['Row'];

export default function BattlePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { character, species, loadCharacter, setMessage } = useGameStore();
  const [mode, setMode] = useState<'menu' | 'difficulty' | 'friend-menu' | 'battle' | 'realtime-battle' | 'challenge' | 'coop'>('menu');
  const [playerBattler, setPlayerBattler] = useState<Battler | null>(null);
  const [opponentBattler, setOpponentBattler] = useState<Battler | null>(null);
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [challengeCount, setChallengeCount] = useState(0);

  // フレンド対戦用
  const [friendCode, setFriendCode] = useState('');
  const [myCode, setMyCode] = useState('');
  const [myUserId, setMyUserId] = useState('');
  const [friendSearchResult, setFriendSearchResult] = useState<string | null>(null);
  const [waitingForAccept, setWaitingForAccept] = useState(false);

  // リアルタイムバトル用
  const [realtimeSessionId, setRealtimeSessionId] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(true);
  const [opponentUserId, setOpponentUserId] = useState('');
  const waitChannelRef = useRef<RealtimeChannel | null>(null);

  useEffect(() => {
    const load = async () => {
      const supabase = createClient();
      const { data } = await supabase.from('species').select('*');
      if (data) setAllSpecies(data as Species[]);

      if (!character) await loadCharacter();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setMyCode(user.id.slice(0, 8).toUpperCase());
        setMyUserId(user.id);
      }

      const challenges = await getPendingChallenges();
      setChallengeCount(challenges.length);

      setIsLoading(false);
    };
    load();
  }, [character, loadCharacter]);

  // URLパラメータからリアルタイムモードを判定（ゲスト側が通知から遷移）
  useEffect(() => {
    if (isLoading || !character || !species) return;
    const realtimeId = searchParams.get('realtime');
    const role = searchParams.get('role');
    if (realtimeId && role === 'guest') {
      startRealtimeBattleAsGuest(realtimeId);
    }
  }, [isLoading, character, species, searchParams]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-500 text-2xl animate-bounce">🥚</p>
      </div>
    );
  }

  if (!character || !species) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50 flex items-center justify-center">
        <p className="text-gray-500">キャラクターがいません</p>
      </div>
    );
  }

  const baseWeight = species.base_weight;
  const charGene = character.gene as Record<string, unknown> | null;
  const strength = calculateStrength({
    discipline: character.discipline,
    care_miss_count: character.care_miss_count,
    weight: character.weight,
    base_weight: baseWeight,
    mini_game_total_score: character.mini_game_total_score,
    mini_game_play_count: character.mini_game_play_count,
    battleBonus: typeof charGene?.battleBonus === 'number' ? charGene.battleBonus : 0,
  });

  const startCpuBattle = (difficulty: 'easy' | 'normal' | 'hard') => {
    const player = createBattler(
      character.name || species.name,
      species.name, species.image_key,
      strength, character.hunger, character.happiness,
    );
    const cpu = createCpuBattler(difficulty);
    setPlayerBattler(player);
    setOpponentBattler(cpu);
    setMode('battle');
  };

  // ===== リアルタイムフレンド対戦（ホスト側）=====
  const sendFriendBattleInvite = async () => {
    if (friendCode.length < 4) return;
    setFriendSearchResult(null);

    const snapshot = createSnapshot(character, species);
    const result = await createBattleInvite(friendCode, snapshot);

    if ('error' in result) {
      setFriendSearchResult(result.error);
      return;
    }

    setRealtimeSessionId(result.sessionId);
    setIsHost(true);
    setWaitingForAccept(true);

    // フレンドのuser_idを取得
    const supabase = createClient();
    const code = friendCode.toLowerCase().replace(/[^a-f0-9]/g, '');
    const { data: friendData } = await supabase.rpc('search_user_by_friend_code', { fc: code });
    const friendUserId = friendData?.[0]?.uid;
    if (friendUserId) {
      setOpponentUserId(friendUserId);
      // Realtimeで招待通知を送信
      notifyInvite(friendUserId, {
        sessionId: result.sessionId,
        hostId: myUserId,
        hostName: character.name || species.name,
        hostSnapshot: snapshot,
        createdAt: new Date().toISOString(),
      });
    }

    // バトルチャンネルでゲスト参加を待機
    const channel = subscribeToBattle(result.sessionId, (event: BattleEvent) => {
      if (event.type === 'guest_joined') {
        // ゲストが参加 → バトル開始
        const guestSnap = event.guestSnapshot;
        const guestSpecies = allSpecies.find(s => s.name === guestSnap.speciesName);

        const player = createBattler(
          character.name || species.name,
          species.name, species.image_key,
          strength, character.hunger, character.happiness,
        );
        const opp = createBattler(
          guestSnap.name, guestSnap.speciesName,
          guestSpecies?.image_key || 'adult_mamecchi',
          guestSnap.strength, guestSnap.hungerPercent, guestSnap.happinessPercent,
        );

        setPlayerBattler(player);
        setOpponentBattler(opp);
        setWaitingForAccept(false);

        // 待機チャンネルをクリーンアップ
        const supabase = createClient();
        supabase.removeChannel(channel);
        waitChannelRef.current = null;

        setMode('realtime-battle');
      }
    });
    waitChannelRef.current = channel;
  };

  // ===== リアルタイムフレンド対戦（ゲスト側 - 通知から遷移）=====
  const startRealtimeBattleAsGuest = async (sessionId: string) => {
    const supabase = createClient();

    // セッション情報取得
    const { data: sessions } = await supabase
      .from('battle_sessions')
      .select('*')
      .eq('id', sessionId)
      .limit(1);

    if (!sessions || sessions.length === 0) {
      setMessage('バトルセッションが見つかりません');
      return;
    }

    const session = sessions[0];
    const hostSnap = session.host_snapshot as unknown as ChallengerSnapshot;
    const hostSpecies = allSpecies.find(s => s.name === hostSnap.speciesName);

    const player = createBattler(
      character.name || species.name,
      species.name, species.image_key,
      strength, character.hunger, character.happiness,
    );
    const opp = createBattler(
      hostSnap.name, hostSnap.speciesName,
      hostSpecies?.image_key || 'adult_mamecchi',
      hostSnap.strength, hostSnap.hungerPercent, hostSnap.happinessPercent,
    );

    setPlayerBattler(player);
    setOpponentBattler(opp);
    setRealtimeSessionId(sessionId);
    setIsHost(false);
    setOpponentUserId(session.host_id);

    // ゲスト参加を通知（ホストのバトルチャンネルへ）
    const snapshot = createSnapshot(character, species);
    const channel = supabase.channel(`battle:${sessionId}`, {
      config: { broadcast: { self: true } },
    });
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'battle_event',
          payload: { type: 'guest_joined', guestSnapshot: snapshot },
        });
        // すぐには閉じない、RealtimeBattleScreen が別途チャンネルを開く
        setTimeout(() => supabase.removeChannel(channel), 2000);
      }
    });

    setMode('realtime-battle');
  };

  const cancelWaiting = () => {
    if (waitChannelRef.current) {
      const supabase = createClient();
      supabase.removeChannel(waitChannelRef.current);
      waitChannelRef.current = null;
    }
    if (realtimeSessionId) {
      import('@/lib/realtime-battle-logic').then(m => m.cancelBattleSession(realtimeSessionId));
    }
    setWaitingForAccept(false);
    setRealtimeSessionId(null);
  };

  const handleBattleEnd = async (won: boolean) => {
    if (won) {
      const supabase = createClient();
      const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
      await supabase
        .from('characters')
        .update({
          happiness: clamp(character.happiness + 15, 0, 100),
          hunger: clamp(character.hunger + 20, 0, 100),
        })
        .eq('id', character.id);
      setMessage('勝利ボーナス！ 気持ち+15 お腹+20');
    }
    setMode('menu');
    router.push('/game');
  };

  const handleCoopEnd = async () => {
    const supabase = createClient();
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    await supabase
      .from('characters')
      .update({
        cleanliness: clamp(character.cleanliness + 20, 0, 100),
      })
      .eq('id', character.id);
    setMessage('おそうじボーナス！ 清潔さ +20');
    setMode('menu');
  };

  // バトル中（CPU / チャレンジ対CPU）
  if (mode === 'battle' && playerBattler && opponentBattler) {
    return (
      <AnimatePresence>
        <BattleScreen
          player={playerBattler}
          opponent={opponentBattler}
          onEnd={handleBattleEnd}
        />
      </AnimatePresence>
    );
  }

  // リアルタイムバトル中
  if (mode === 'realtime-battle' && playerBattler && opponentBattler && realtimeSessionId) {
    return (
      <AnimatePresence>
        <RealtimeBattleScreen
          sessionId={realtimeSessionId}
          isHost={isHost}
          player={playerBattler}
          opponent={opponentBattler}
          myUserId={myUserId}
          opponentUserId={opponentUserId}
          onEnd={handleBattleEnd}
        />
      </AnimatePresence>
    );
  }

  // 協力ゲーム
  if (mode === 'coop') {
    return (
      <AnimatePresence>
        <CoopGameScreen onClose={handleCoopEnd} />
      </AnimatePresence>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-orange-50">
      <header className="bg-gradient-to-r from-red-500/90 to-orange-400/90 backdrop-blur-md shadow-lg px-4 py-3 flex items-center">
        <button
          onClick={() => {
            if (waitingForAccept) cancelWaiting();
            mode === 'menu' ? router.push('/game') : setMode('menu');
          }}
          className="text-white hover:text-white/80 mr-3 font-bold"
        >
          ← 戻る
        </button>
        <h1 className="text-lg font-bold text-white">⚔️ バトル&協力</h1>
      </header>

      <main className="max-w-lg mx-auto p-4">
        {/* 自分のステータス */}
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm mb-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14">
              <BattlerImageSmall imageKey={species.image_key} name={species.name} />
            </div>
            <div>
              <p className="font-bold text-gray-800">{character.name || species.name}</p>
              <p className="text-sm text-gray-500">{species.name}</p>
            </div>
            <div className="ml-auto text-right">
              <p className="text-2xl font-bold text-red-500">{strength}</p>
              <p className="text-xs text-gray-400">強さ</p>
            </div>
          </div>
        </div>

        {mode === 'menu' && (
          <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1">対戦</p>
            <button
              onClick={() => setMode('difficulty')}
              className="w-full py-4 bg-gradient-to-r from-red-400 to-orange-400 text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-2"
            >
              🤖 CPU対戦
            </button>
            <button
              onClick={() => setMode('friend-menu')}
              className="w-full py-4 bg-gradient-to-r from-blue-400 to-cyan-400 text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-2"
            >
              👥 フレンド対戦（リアルタイム）
            </button>
            <button
              onClick={() => setMode('challenge')}
              className="w-full py-4 bg-gradient-to-r from-indigo-400 to-purple-400 text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-2 relative"
            >
              📨 チャレンジバトル
              {challengeCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center shadow">
                  {challengeCount}
                </span>
              )}
            </button>

            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider px-1 mt-4">協力</p>
            <button
              onClick={() => setMode('coop')}
              className="w-full py-4 bg-gradient-to-r from-cyan-400 to-teal-400 text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-2"
            >
              🧹 おそうじリレー（2人協力）
            </button>
          </div>
        )}

        {mode === 'difficulty' && (
          <div className="space-y-3">
            <p className="text-center text-gray-600 font-bold mb-2">難易度を選択</p>
            {([
              { key: 'easy' as const, label: 'かんたん', desc: '初心者向け', color: 'from-green-400 to-emerald-400', emoji: '🌱' },
              { key: 'normal' as const, label: 'ふつう', desc: 'バランス良い戦い', color: 'from-yellow-400 to-amber-400', emoji: '⚔️' },
              { key: 'hard' as const, label: 'むずかしい', desc: '強敵に挑戦', color: 'from-red-400 to-rose-500', emoji: '🔥' },
            ]).map((d) => (
              <button
                key={d.key}
                onClick={() => startCpuBattle(d.key)}
                className={`w-full py-4 bg-gradient-to-r ${d.color} text-white font-bold rounded-2xl shadow-lg text-base flex items-center justify-center gap-3`}
              >
                <span className="text-xl">{d.emoji}</span>
                <div className="text-left">
                  <span className="block">{d.label}</span>
                  <span className="block text-xs text-white/80 font-normal">{d.desc}</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {mode === 'friend-menu' && (
          <div className="space-y-4">
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
              <p className="text-sm text-gray-600 font-bold mb-2">あなたのフレンドコード</p>
              <p className="text-2xl font-bold text-blue-600 tracking-wider text-center py-2 bg-blue-50 rounded-xl">
                {myCode}
              </p>
              <p className="text-xs text-gray-400 mt-1 text-center">
                このコードを友達に教えよう！
              </p>
            </div>

            {!waitingForAccept ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-4 shadow-sm">
                <p className="text-sm text-gray-600 font-bold mb-2">フレンドコードで対戦</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={friendCode}
                    onChange={(e) => setFriendCode(e.target.value.toUpperCase())}
                    placeholder="コードを入力"
                    maxLength={8}
                    className="flex-1 border border-gray-300 rounded-xl px-3 py-2.5 text-center font-bold tracking-wider uppercase"
                  />
                  <button
                    onClick={sendFriendBattleInvite}
                    className="px-5 py-2.5 bg-blue-500 text-white font-bold rounded-xl hover:bg-blue-600 transition"
                  >
                    招待
                  </button>
                </div>
                {friendSearchResult && (
                  <p className="text-sm text-red-500 mt-2 text-center">{friendSearchResult}</p>
                )}
                <p className="text-xs text-gray-400 mt-2 text-center">
                  フレンドコードを入力して招待を送ると、相手のゲーム画面に通知が届きます
                </p>
              </div>
            ) : (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-sm text-center">
                <div className="text-4xl mb-3 animate-pulse">⚔️</div>
                <p className="font-bold text-gray-800 mb-2">招待を送信しました</p>
                <p className="text-sm text-gray-500 mb-4">
                  相手が受諾するのを待っています...
                </p>
                <div className="flex justify-center gap-2 mb-3">
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
                <button
                  onClick={cancelWaiting}
                  className="text-sm text-gray-400 underline"
                >
                  キャンセル
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* チャレンジパネル */}
      <AnimatePresence>
        {mode === 'challenge' && (
          <ChallengePanel
            onClose={() => { setMode('menu'); setChallengeCount(0); }}
            myCode={myCode}
            onStartBattle={(playerB, opponentB) => {
              setPlayerBattler(playerB);
              setOpponentBattler(opponentB);
              setMode('battle');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function BattlerImageSmall({ imageKey, name }: { imageKey: string; name: string }) {
  const [error, setError] = useState(false);
  const src = error ? getPlaceholderSvg(imageKey, 56) : getCharacterImagePath(imageKey);
  return (
    <Image
      src={src} alt={name} width={56} height={56}
      className="object-contain" onError={() => setError(true)}
    />
  );
}
