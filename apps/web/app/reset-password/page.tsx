import { ResetPassword } from './reset-password';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  return (
    <main>
      <h1>Новый пароль</h1>
      {token ? <ResetPassword token={token} /> : <p className="error">Токен не найден в ссылке.</p>}
    </main>
  );
}
