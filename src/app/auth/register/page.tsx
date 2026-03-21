'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('パスワードが一致しません');
      return;
    }

    if (username.length < 1 || username.length > 20) {
      setError('ユーザー名は1〜20文字で入力してください');
      return;
    }

    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          username,
        },
      },
    });

    if (error) {
      setError(error.message === 'User already registered'
        ? 'このメールアドレスは既に登録されています'
        : `登録に失敗しました: ${error.message}`);
      setLoading(false);
      return;
    }

    router.push('/game');
    router.refresh();
  };

  const inputClass = "w-full px-4 py-3 border border-base-200 rounded-2xl focus:ring-2 focus:ring-muted-blue/30 focus:border-muted-blue/40 outline-none transition bg-white/40 backdrop-blur-sm text-text-primary text-sm tracking-relaxed placeholder:text-text-tertiary";

  return (
    <div className="min-h-screen bg-gradient-to-b from-base-50 to-base-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md glass rounded-3xl shadow-soft-md p-8">
        <h1 className="text-lg font-light text-center text-text-primary mb-1 tracking-airy">
          はじめまして
        </h1>
        <p className="text-center text-text-tertiary text-[10px] mb-8 tracking-relaxed">
          そだてるっちのアカウントを作成
        </p>

        <form onSubmit={handleRegister} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-[10px] font-medium text-text-secondary mb-1.5 tracking-relaxed">
              ユーザー名
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              maxLength={20}
              className={inputClass}
              placeholder="たまごっちマスター"
            />
          </div>

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
              className={inputClass}
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
              className={inputClass}
              placeholder="6文字以上"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-[10px] font-medium text-text-secondary mb-1.5 tracking-relaxed">
              パスワード（確認）
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              className={inputClass}
              placeholder="もう一度入力"
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
            {loading ? '登録中...' : 'アカウント作成'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-text-tertiary text-[10px] tracking-relaxed">
            アカウントをお持ちの方は
            <Link href="/auth/login" className="text-muted-blue hover:text-muted-blue/80 font-medium ml-1">
              ログイン
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
