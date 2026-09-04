# Модуль: OAuth (Google)

Вход через Google + account linking: если пользователь с этим email уже есть,
провайдер привязывается к нему.

## Что входит

- Поля `provider`, `provider_account_id` в `users` (миграция `0004_oauth.sql`)
- `GET /api/v1/auth/oauth/google` — старт (redirect)
- `GET /api/v1/auth/oauth/google/callback` — обмен кода, сессия, redirect на `/`
- CSRF-защита state-кукой

## Настройка

1. Google Cloud Console → OAuth client (Web)
2. Redirect URI: `https://<домен>/api/v1/auth/oauth/google/callback`
   Локально: `http://localhost:8080/api/v1/auth/oauth/google/callback`
   (`localhost` выбран потому, что Google принимает loopback с любым портом)
3. `.env` / секреты: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`

## Ограничения

- В проде нужен публичный HTTPS-домен: с самоподписанным сертификатом
  (доступ по IP) OAuth-провайдеры работать не будут.
- Apple OAuth в v1 не реализован: требует публичный HTTPS-домен и не
  проверяется локально.

## Проверка

Кнопка «Войти через Google» на /login → после согласия оказываешься
залогиненным на /.
