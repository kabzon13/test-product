'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';

import { api } from '@/lib/api/browser';

export function VerifyEmail({ token }: { token: string }) {
  const [state, setState] = useState<'pending' | 'ok' | 'error'>('pending');
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void api
      .POST('/auth/verify-email', { body: { token } })
      .then(({ error }) => setState(error ? 'error' : 'ok'));
  }, [token]);

  if (state === 'pending') return <p>Проверяем токен…</p>;
  if (state === 'error')
    return <p className="error">Токен недействителен, истёк или уже использован.</p>;
  return (
    <p className="ok">
      Email подтверждён. <Link href="/login">Войти</Link>
    </p>
  );
}
