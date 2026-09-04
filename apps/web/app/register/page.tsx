'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { api } from '@/lib/api/browser';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const { error: err } = await api.POST('/auth/register', { body: { email, password } });
    if (err) {
      setError((err as { message?: string }).message ?? 'Registration failed');
      return;
    }
    setDone(true);
  }

  if (done) {
    return (
      <main>
        <h1>Проверьте почту</h1>
        <p>
          Мы отправили письмо на <strong>{email}</strong>. Перейдите по ссылке, чтобы подтвердить
          адрес, затем <Link href="/login">войдите</Link>.
        </p>
      </main>
    );
  }

  return (
    <main>
      <h1>Регистрация</h1>
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
          placeholder="пароль (мин. 8 символов)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={8}
          required
        />
        {error && <p className="error">{error}</p>}
        <button type="submit">Создать аккаунт</button>
      </form>
      <p className="muted">
        Уже есть аккаунт? <Link href="/login">Войти</Link>
      </p>
    </main>
  );
}
