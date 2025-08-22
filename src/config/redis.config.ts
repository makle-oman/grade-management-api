import { CacheModuleOptions } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';

export const getRedisConfig = (configService: ConfigService): CacheModuleOptions => ({
  ttl: 300, // 5分钟默认缓存时间
  max: 100, // 最大缓存项数
  // 如果有Redis，可以配置Redis store
  // store: redisStore,
  // host: configService.get('REDIS_HOST', 'localhost'),
  // port: configService.get('REDIS_PORT', 6379),
});