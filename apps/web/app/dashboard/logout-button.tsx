'use client';

import { useRouter } from 'next/navigation';

import { api } from '@/lib/api/browser';

export function LogoutButton() {
  const router = useRouter();

  async function logout() {
    await api.POST('/auth/logout');
    router.push('/');
    router.refresh();
  }

  return (
    <button className="secondary" onClick={() => void logout()}>
      Выйти
    </button>
  );
}
