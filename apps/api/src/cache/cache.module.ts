import { Global, Module } from '@nestjs/common';

import { env } from '../env';

import { CACHE, MemoryCache, type CacheService } from './cache.service';
import { RedisCache } from './redis.cache';

function createCache(): CacheService {
  if (env.REDIS_URL) {
    return new RedisCache(env.REDIS_URL);
  }
  return new MemoryCache();
}

@Global()
@Module({
  providers: [{ provide: CACHE, useFactory: createCache }],
  exports: [CACHE],
})
export class CacheModule {}
