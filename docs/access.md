# Сетевой доступ

Операции отсюда выполняются редко и к моменту надобности забываются.
Не выводить их из терраформа — читать здесь.

## Две переменные firewall — и зачем они разделены

```hcl
# deploy/environments/<env>.tfvars
admin_ips     = ["203.0.113.7/32"]   # прямой вход на 443 мимо Cloudflare
ssh_allow_ips = ["203.0.113.7/32"]   # SSH
```

Если бы переменная была одна, закрытие прямого доступа к сайту заодно
отрезало бы SSH — и вы остались бы без входа на сервер.
Меняются правкой tfvars + `make infra-apply ENV=<env>`. Из панели DO firewall не трогать.

## Доступ по IP, пока нет домена

Caddy всегда отвечает на `https://<reserved-ip>` с самоподписанным сертификатом
(блок `:443`, `tls internal`). Браузер покажет предупреждение — принять.
Снаружи этот вход прикрыт firewall: пускает только `admin_ips`.

## Закрыть прямой доступ после запуска домена

Прямой вход обходит WAF, rate limiting и DDoS-защиту Cloudflare. После запуска:

```hcl
admin_ips     = []                   # закрыли 443 для всех, кроме Cloudflare
ssh_allow_ips = ["203.0.113.7/32"]   # SSH оставили
```

```
make infra-apply ENV=production
```

Блок `:443` в Caddy остаётся, но снаружи до него уже не достучаться.

## Зайти в обход Cloudflare, не открывая firewall

SSH-туннель, который и так есть:

```
ssh -N -L 8443:localhost:443 deploy@<reserved-ip>
```

Дальше `https://localhost:8443` (предупреждение о сертификате — ок).

## Grafana

Наружу не смотрит (127.0.0.1:3001 на сервере). Тем же туннелем:

```
ssh -N -L 3001:localhost:3001 deploy@<reserved-ip>
```

→ http://localhost:3001, логин `admin`, пароль — секрет `GRAFANA_ADMIN_PASSWORD`.

## Сменился мой IP — SSH не пускает

1. Консоль DigitalOcean → Droplet → Access → Launch Console
2. Либо: с другой машины/сети, чей IP ещё в списке
3. Поправить `ssh_allow_ips` в tfvars → `make infra-apply ENV=<env>`
   (запускать можно откуда угодно — доступ к DO API не зависит от firewall дроплета)

## Ротация SSH-ключа деплоя

1. `ssh-keygen -t ed25519 -N '' -f /tmp/new-key`
2. Публичный → `ssh_public_key` в tfvars → `make infra-apply ENV=<env>`
   (cloud-init обновит только при пересоздании; для живого сервера добавить ключ
   в `~deploy/.ssh/authorized_keys` вручную с теми же ограничениями
   `no-agent-forwarding,no-X11-forwarding,no-pty`)
3. Приватный → `gh secret set DEPLOY_SSH_KEY --env <env> < /tmp/new-key`
4. Прогнать deploy workflow — убедиться, что ходит новым ключом
5. Удалить старый ключ из `authorized_keys`, `rm /tmp/new-key*`
