# Модуль: Email

`EmailProvider` — интерфейс в Core. Локально письма всегда ловит Mailpit
(http://localhost:8025). Модуль добавляет прод-провайдера.

## Провайдеры

| EMAIL_PROVIDER | Что нужно                                |
| -------------- | ---------------------------------------- |
| `smtp`         | `SMTP_URL` (`smtp://user:pass@host:587`) |
| `resend`       | `RESEND_API_KEY`                         |

Выбор — только `.env`, бизнес-код не меняется.

## Письма Core

- verify email (`auth_tokens` type `email_verify`, TTL 24ч)
- password reset (type `password_reset`, TTL 1ч)

Шаблоны: `apps/api/src/email/templates.ts`.

## Проверка

`make dev` → регистрация на http://localhost:8080/register → письмо в Mailpit.
В проде: `EMAIL_PROVIDER=resend` + ключ, отправить reset самому себе.
