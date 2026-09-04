import { redirect } from 'next/navigation';

import { LogoutButton } from './logout-button';

import { serverApi } from '@/lib/api/server';

export default async function DashboardPage() {
  const api = await serverApi();
  const { data: user } = await api.GET('/auth/me').catch(() => ({ data: undefined }));
  if (!user) redirect('/login');

  return (
    <main>
      <h1>Dashboard</h1>
      <p>
        Вы вошли как <strong>{user.email}</strong>.
      </p>
      {!user.emailVerifiedAt && <p className="error">Email не подтверждён — проверьте почту.</p>}
      <LogoutButton />
    </main>
  );
}
