'use client';

import { useState, type FormEvent } from 'react';

import { api } from '@/lib/api/browser';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [done, setDone] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    await api.POST('/auth/request-password-reset', { body: { email } });
    setDone(true);
  }

  return (
    <main>
      <h1>Сброс пароля</h1>
      {done ? (
        <p>Если такой аккаунт существует, мы отправили письмо со ссылкой для сброса.</p>
      ) : (
        <form onSubmit={(e) => void onSubmit(e)}>
          <input
            type="email"
            placeholder="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Отправить ссылку</button>
        </form>
      )}
    </main>
  );
}
