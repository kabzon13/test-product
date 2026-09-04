# Модуль: Storage

S3-совместимое хранилище файлов. Локально — MinIO, в проде — любой S3-провайдер
(DO Spaces, AWS S3, R2).

## Что в Core

- `StorageService`: put / get / delete / presignUpload / presignDownload
  (`apps/api/src/storage/storage.service.ts`)
- Таблица `files` (миграция `0002_files.sql`)
- Эндпоинты: `POST /files/presign-upload`, `POST /files/:id/complete`,
  `GET /files/:id/download-url` — все под сессией
- MinIO в `docker-compose.dev.yml` (консоль: http://localhost:9001)

## Включение в проде

Только `.env` — бизнес-код не меняется:

```
S3_ENDPOINT=https://fra1.digitaloceanspaces.com
S3_REGION=fra1
S3_BUCKET=<bucket>
S3_ACCESS_KEY=…
S3_SECRET_KEY=…
S3_FORCE_PATH_STYLE=false
```

## R2 с первого дня (Cloudflare)

Когда для продукта точно будет Cloudflare (домен) и файлы будут раздаваться
пользователям — можно сразу взять R2 вместо Spaces: исходящий трафик у R2
бесплатный. Код не меняется, это те же 4+2 переменные.

1. Панель Cloudflare → **R2 Object Storage** → Create bucket (имя = имя продукта)
2. R2 → **Manage R2 API Tokens** → Create API Token (права Object Read & Write,
   можно ограничить одним бакетом) → получишь Access Key ID и Secret Access Key
3. Account ID — на главной странице R2 (или в адресной строке панели)
4. Секреты окружения (GitHub Environment) / `.env`:

```
S3_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
S3_REGION=auto
S3_BUCKET=<имя-бакета>
S3_ACCESS_KEY=<Access Key ID>
S3_SECRET_KEY=<Secret Access Key>
S3_FORCE_PATH_STYLE=false
```

Нюансы:

- `S3_REGION=auto` — так требует R2, это не опечатка
- Presigned-ссылки (наш поток загрузки/скачивания) работают как в любом S3
- Публичную раздачу напрямую из бакета можно включить через
  R2 Custom Domain — тогда файлы едут через CDN Cloudflare
- tfstate и бэкапы БД при этом остаются в Spaces: они привязаны
  к инфраструктуре DigitalOcean и трафика не генерируют

## Поток загрузки

1. клиент → `POST /files/presign-upload {filename, contentType}` → `{fileId, url}`
2. клиент → `PUT url` (файл напрямую в S3, мимо API)
3. клиент → `POST /files/:id/complete`

## Проверка

`make dev`, залогиниться, `POST /api/v1/files/presign-upload` из Swagger —
в ответе presigned URL; PUT по нему кладёт файл в MinIO (видно в консоли :9001).
