'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';

import { api } from '@/lib/api/browser';

export function ResetPassword({ token }: { token: string }) {
  const [password, setPassword] = useState('');
  const [state, setState] = useState<'idle' | 'ok' | 'error'>('idle');

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    const { error } = await api.POST('/auth/reset-password', { body: { token, password } });
    setState(error ? 'error' : 'ok');
  }

  if (state === 'ok') {
    return (
      <p className="ok">
        Пароль изменён. <Link href="/login">Войти</Link>
      </p>
    );
  }

  return (
    <form onSubmit={(e) => void onSubmit(e)}>
      <input
        type="password"
        placeholder="новый пароль (мин. 8 символов)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        minLength={8}
        required
      />
      {state === 'error' && <p className="error">Не получилось: токен недействителен или истёк.</p>}
      <button type="submit">Сохранить</button>
    </form>
  );
}
