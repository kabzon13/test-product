# Модуль: Queue (worker + фоновые задачи)

Интерфейс `JobQueue` в Core (`apps/api/src/queue/job-queue.ts`), два драйвера:

| QUEUE_DRIVER       | Хранилище           | Когда                                    |
| ------------------ | ------------------- | ---------------------------------------- |
| `pg-boss` (дефолт) | PostgreSQL          | не тянет Redis ради самого факта очереди |
| `bullmq`           | Redis (`REDIS_URL`) | большие объёмы/скорость                  |

## Использование в API

```ts
constructor(@Inject(JOB_QUEUE) private queue: JobQueue) {}
await this.queue.enqueue('heartbeat', { at: Date.now() });
```

## Worker

`apps/worker` — отдельный процесс/контейнер. Обработчики регистрируются
в `apps/worker/src/handlers.ts`:

```ts
export const handlers = {
  'my-job': async (data, logger) => { … },
};
```

## Прод

Свой образ (`infra/docker/Dockerfile.worker`), сервис `worker` в compose,
деплоится вместе со всеми.

## Проверка

`make dev` → в коде API вызвать enqueue('heartbeat', {}) → в логах worker
строка `heartbeat handled`.
