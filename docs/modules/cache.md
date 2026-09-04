# Модуль: Cache (Redis)

`CacheService` — интерфейс в Core с in-memory реализацией. Модуль подключает Redis.

## Использование

```ts
constructor(@Inject(CACHE) private cache: CacheService) {}
await this.cache.set('key', value, 60); // TTL в секундах
const v = await this.cache.get<T>('key');
```

## Включение

`REDIS_URL=redis://redis:6379` в `.env` — реализация переключается сама
(`apps/api/src/cache/cache.module.ts`). Убрать переменную → снова in-memory.

## Что помнить

- In-memory кэш живёт в процессе: обнуляется на деплое, не разделяется между
  api и worker. Для одной реплики этого обычно достаточно.
- Redis в compose наружу не торчит.
