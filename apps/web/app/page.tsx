import Link from 'next/link';

import { serverApi } from '@/lib/api/server';

export default async function HomePage() {
  let email: string | null = null;
  try {
    const api = await serverApi();
    const { data } = await api.GET('/auth/me');
    email = data?.email ?? null;
  } catch {
    // API недоступен — страница всё равно рендерится
  }

  return (
    <main>
      <h1>test</h1>
      {email ? (
        <p>
          Вы вошли как <strong>{email}</strong>. <Link href="/dashboard">Dashboard →</Link>
        </p>
      ) : (
        <p>
          <Link href="/login">Войти</Link> или <Link href="/register">создать аккаунт</Link>.
        </p>
      )}
    </main>
  );
}
