import { expect, test } from '@playwright/test';

const MAILPIT = `http://localhost:${process.env.DEV_MAILPIT_UI_PORT ?? '8025'}`;

async function findToken(
  request: import('@playwright/test').APIRequestContext,
  email: string,
  kind: 'verify-email' | 'reset-password',
): Promise<string> {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const search = await request.get(`${MAILPIT}/api/v1/search?query=to:${email}`);
    const { messages } = (await search.json()) as { messages: Array<{ ID: string }> };
    const first = messages[0];
    if (first) {
      const msg = await request.get(`${MAILPIT}/api/v1/message/${first.ID}`);
      const body = (await msg.json()) as { Text: string };
      const match = body.Text.match(new RegExp(`${kind}\\?token=([A-Za-z0-9_-]+)`));
      if (match?.[1]) return match[1];
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`письмо для ${email} (${kind}) не пришло в Mailpit`);
}

test('регистрация → verify email → вход → защищённая страница → выход', async ({
  page,
  request,
}) => {
  const email = `e2e-${Date.now()}@example.com`;
  const password = 'password-123';

  // регистрация
  await page.goto('/register');
  await page.getByPlaceholder('email').fill(email);
  await page.getByPlaceholder(/пароль/).fill(password);
  await page.getByRole('button', { name: 'Создать аккаунт' }).click();
  await expect(page.getByText('Проверьте почту')).toBeVisible();

  // verify email по ссылке из письма
  const token = await findToken(request, email, 'verify-email');
  await page.goto(`/verify-email?token=${token}`);
  await expect(page.getByText('Email подтверждён')).toBeVisible();

  // вход
  await page.goto('/login');
  await page.getByPlaceholder('email').fill(email);
  await page.getByPlaceholder('пароль', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Войти' }).click();

  // защищённая страница
  await page.waitForURL('**/dashboard');
  await expect(page.getByText(email)).toBeVisible();

  // выход
  await page.getByRole('button', { name: 'Выйти' }).click();
  await page.waitForURL('**/');
  await page.goto('/dashboard');
  await page.waitForURL('**/login');
});
