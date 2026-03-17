'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { getCharacterImagePath, getPlaceholderSvg } from '@/lib/character-images';
import type { Database } from '@/types/database';

type Species = Database['public']['Tables']['species']['Row'];

export default function EncyclopediaPage() {
  const router = useRouter();
  const [allSpecies, setAllSpecies] = useState<Species[]>([]);
  const [discoveredIds, setDiscoveredIds] = useState<Set<string>>(new Set());
  const [selectedSpecies, setSelectedSpecies] = useState<Species | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      const supabase = createClient();

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const [speciesRes, historyRes, charRes] = await Promise.all([
        supabase.from('species').select('*').order('stage'),
        supabase.from('character_history').select('species_id').eq('user_id', user.id),
        // is_alive問わず全キャラの種族を取得（履歴保存失敗で消失したデータも拾う安全策）
        supabase.from('characters').select('species_id').eq('user_id', user.id),
      ]);

      if (speciesRes.data) setAllSpecies(speciesRes.data as Species[]);

      const ids = new Set<string>();
      (historyRes.data as Array<{ species_id: string }> | null)?.forEach((h) => ids.add(h.species_id));
      (charRes.data as Array<{ species_id: string }> | null)?.forEach((c) => ids.add(c.species_id));
      setDiscoveredIds(ids);
      setLoading(false);
    };

    loadData();
  }, []);

  const stageGroups = [
    { key: 'baby', label: 'ベビー期' },
    { key: 'kids', label: 'キッズ期' },
    { key: 'young', label: 'ヤング期' },
    { key: 'adult', label: 'アダルト期' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50 flex items-center justify-center">
        <p className="text-gray-500">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-blue-50">
      <header className="bg-white/80 backdrop-blur-sm border-b border-purple-100 px-4 py-3 flex items-center">
        <button
          onClick={() => router.push('/game')}
          className="text-purple-500 hover:text-purple-700 mr-3"
        >
          ← もどる
        </button>
        <h1 className="text-lg font-bold text-purple-600">📖 しんか図鑑</h1>
        <span className="ml-auto text-sm text-gray-500">
          {discoveredIds.size}/{allSpecies.length} 発見
        </span>
      </header>

      <main className="max-w-lg mx-auto p-4 space-y-6">
        {stageGroups.map((group) => {
          const species = allSpecies.filter(s => s.stage === group.key);
          if (species.length === 0) return null;

          return (
            <section key={group.key}>
              <h2 className="text-sm font-bold text-purple-500 mb-2">{group.label}</h2>
              <div className="grid grid-cols-3 gap-3">
                {species.map((s) => {
                  const discovered = discoveredIds.has(s.id);
                  return (
                    <button
                      key={s.id}
                      onClick={() => discovered && setSelectedSpecies(s)}
                      className={`
                        flex flex-col items-center p-3 rounded-xl transition
                        ${discovered
                          ? 'bg-white shadow-sm hover:shadow-md'
                          : 'bg-gray-100 cursor-default'
                        }
                      `}
                    >
                      <div className="w-16 h-16 relative mb-1">
                        {discovered ? (
                          <SpeciesImage imageKey={s.image_key} name={s.name} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-3xl text-gray-300">
                            ?
                          </div>
                        )}
                      </div>
                      <span className={`text-xs ${discovered ? 'text-gray-700' : 'text-gray-300'}`}>
                        {discovered ? s.name : '？？？'}
                      </span>
                      {s.rarity !== 'common' && discovered && (
                        <span className={`text-xs mt-0.5 ${
                          s.rarity === 'legendary' ? 'text-yellow-500' : 'text-purple-400'
                        }`}>
                          {s.rarity === 'legendary' ? '★伝説' : '☆レア'}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </section>
          );
        })}
      </main>

      {/* 詳細モーダル */}
      {selectedSpecies && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedSpecies(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-32 h-32 mx-auto mb-3 relative">
                <SpeciesImage imageKey={selectedSpecies.image_key} name={selectedSpecies.name} size={128} />
              </div>
              <h3 className="text-xl font-bold text-purple-600">{selectedSpecies.name}</h3>
              {selectedSpecies.rarity !== 'common' && (
                <span className={`text-sm ${
                  selectedSpecies.rarity === 'legendary' ? 'text-yellow-500' : 'text-purple-400'
                }`}>
                  {selectedSpecies.rarity === 'legendary' ? '★ 伝説' : '☆ レア'}
                </span>
              )}
              <p className="text-sm text-gray-500 mt-2">{selectedSpecies.description}</p>
              <p className="text-xs text-gray-400 mt-2">標準体重: {selectedSpecies.base_weight}g</p>
            </div>
            <button
              onClick={() => setSelectedSpecies(null)}
              className="w-full mt-4 py-2 bg-purple-500 text-white rounded-xl hover:bg-purple-600 transition"
            >
              とじる
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function SpeciesImage({ imageKey, name, size = 64 }: { imageKey: string; name: string; size?: number }) {
  const [error, setError] = useState(false);
  const src = error ? getPlaceholderSvg(imageKey, size) : getCharacterImagePath(imageKey);

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      className="object-contain"
      onError={() => setError(true)}
    />
  );
}
