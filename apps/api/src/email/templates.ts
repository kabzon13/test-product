export interface EmailContent {
  subject: string;
  text: string;
  html: string;
}

export function verifyEmail(url: string): EmailContent {
  return {
    subject: 'Подтвердите email',
    text: `Подтвердите email: ${url}\nСсылка действует 24 часа.`,
    html: `<p>Подтвердите email: <a href="${url}">${url}</a></p><p>Ссылка действует 24 часа.</p>`,
  };
}

export function resetPassword(url: string): EmailContent {
  return {
    subject: 'Сброс пароля',
    text: `Сбросить пароль: ${url}\nСсылка действует 1 час. Если вы не запрашивали сброс — игнорируйте письмо.`,
    html: `<p>Сбросить пароль: <a href="${url}">${url}</a></p><p>Ссылка действует 1 час. Если вы не запрашивали сброс — игнорируйте письмо.</p>`,
  };
}
