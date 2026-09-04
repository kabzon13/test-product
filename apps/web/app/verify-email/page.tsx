import { VerifyEmail } from './verify-email';

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main>
      <h1>Подтверждение email</h1>
      {token ? <VerifyEmail token={token} /> : <p className="error">Токен не найден в ссылке.</p>}
    </main>
  );
}
