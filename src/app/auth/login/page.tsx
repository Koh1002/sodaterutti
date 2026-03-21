'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('メールアドレスまたはパスワードが正しくありません');
      setLoading(false);
      return;
    }

    router.push('/game');
    router.refresh();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-3xl shadow-soft-md p-8">
        <h1 className="text-lg font-light text-center text-text-primary mb-1 tracking-airy">
          おかえりなさい
        </h1>
        <p className="text-center text-text-tertiary text-[10px] mb-8 tracking-relaxed">
          そだてるっちにログイン
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[10px] font-medium text-text-secondary mb-1.5 tracking-relaxed">
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 border border-base-200 rounded-2xl focus:ring-2 focus:ring-muted-blue/30 focus:border-muted-blue/40 outline-none transition bg-white/40 backdrop-blur-sm text-text-primary text-sm tracking-relaxed placeholder:text-text-tertiary"
              placeholder="example@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-[10px] font-medium text-text-secondary mb-1.5 tracking-relaxed">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              className="w-full px-4 py-3 border border-base-200 rounded-2xl focus:ring-2 focus:ring-muted-blue/30 focus:border-muted-blue/40 outline-none transition bg-white/40 backdrop-blur-sm text-text-primary text-sm tracking-relaxed placeholder:text-text-tertiary"
              placeholder="6文字以上"
            />
          </div>

          {error && (
            <p className="text-muted-rose text-[10px] text-center tracking-relaxed">{error}</p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-muted-blue/80 hover:bg-muted-blue text-white font-medium rounded-2xl transition shadow-soft disabled:opacity-50 disabled:cursor-not-allowed text-sm tracking-relaxed press-effect"
          >
            {loading ? 'ログイン中...' : 'ログイン'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-tertiary text-[10px] tracking-relaxed">
            アカウントをお持ちでない方は
            <Link href="/auth/register" className="text-muted-blue hover:text-muted-blue/80 font-medium ml-1">
              新規登録
            </Link>
          </p>
        </div>

        <div className="mt-4 text-center">
          <Link href="/" className="text-text-tertiary hover:text-text-secondary text-[10px] tracking-relaxed">
            トップページへ戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
