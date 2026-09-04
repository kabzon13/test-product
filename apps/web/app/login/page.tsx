'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { api } from '@/lib/api/browser';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: err } = await api.POST('/auth/login', { body: { email, password } });
    if (err) {
      setError('Неверный email или пароль');
      return;
    }
    router.push('/dashboard');
    router.refresh();
  }

  return (
    <main>
      <h1>Вход</h1>
      <form onSubmit={(e) => void onSubmit(e)}>
        <input
          type="email"
          placeholder="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="пароль"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Войти</button>
      </form>
      <p>
        <a href="/api/v1/auth/oauth/google">Войти через Google</a>
      </p>
      <p className="muted">
        <Link href="/register">Регистрация</Link> ·{' '}
        <Link href="/forgot-password">Забыли пароль?</Link>
      </p>
    </main>
  );
}
