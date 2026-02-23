import Link from 'next/link';

export default function TopPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-pink-100 via-purple-100 to-blue-100 flex flex-col">
      {/* メインビジュアル */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        {/* タイトルロゴ（画像挿入予定箇所） */}
        <div className="mb-8">
          <div className="text-6xl mb-4 animate-bounce">🥚</div>
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400 bg-clip-text text-transparent">
            そだてるっち
          </h1>
          <p className="text-gray-500 mt-2 text-lg">
            〜キャラクター育成ゲーム〜
          </p>
        </div>

        {/* キャラクタープレビュー（画像挿入予定箇所） */}
        <div className="flex gap-3 mb-8 text-4xl">
          <span className="animate-bounce" style={{ animationDelay: '0ms' }}>🐣</span>
          <span className="animate-bounce" style={{ animationDelay: '100ms' }}>🐥</span>
          <span className="animate-bounce" style={{ animationDelay: '200ms' }}>🐤</span>
          <span className="animate-bounce" style={{ animationDelay: '300ms' }}>🐔</span>
          <span className="animate-bounce" style={{ animationDelay: '400ms' }}>🌟</span>
        </div>

        {/* 説明 */}
        <div className="max-w-md space-y-3 mb-8">
          <FeatureCard
            icon="🍚"
            title="毎日お世話"
            description="ごはんをあげたり、遊んだり、お掃除したり。毎日のお世話でキャラクターが成長！"
          />
          <FeatureCard
            icon="✨"
            title="進化で変身"
            description="育て方によって進化先が変わる！22種類以上のキャラクターを発見しよう"
          />
          <FeatureCard
            icon="💒"
            title="結婚・世代交代"
            description="大人になったら結婚して次の世代へ。家系図をつないでいこう"
          />
        </div>

        {/* CTA */}
        <div className="space-y-3 w-full max-w-xs">
          <Link
            href="/auth/register"
            className="block w-full py-4 bg-purple-500 hover:bg-purple-600 text-white font-bold rounded-xl transition shadow-lg text-center text-lg"
          >
            はじめる
          </Link>
          <Link
            href="/auth/login"
            className="block w-full py-3 bg-white hover:bg-gray-50 text-purple-600 font-medium rounded-xl transition shadow-sm border border-purple-200 text-center"
          >
            ログイン
          </Link>
        </div>
      </main>

      {/* フッター */}
      <footer className="text-center py-4 text-xs text-gray-400">
        <p>そだてるっち &copy; 2026</p>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: string; title: string; description: string }) {
  return (
    <div className="bg-white/70 backdrop-blur-sm rounded-xl p-4 flex items-start gap-3 text-left shadow-sm">
      <span className="text-2xl shrink-0">{icon}</span>
      <div>
        <h3 className="font-bold text-gray-700 text-sm">{title}</h3>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
      </div>
    </div>
  );
}
