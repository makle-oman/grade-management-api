import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';

export const getDatabaseConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'sqlite',
  database: 'data/grade_management.sqlite',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  synchronize: process.env.NODE_ENV !== 'production',
  logging: process.env.NODE_ENV === 'development',
  // 连接池配置
  extra: {
    // SQLite 特定配置
    busy_timeout: 30000,
    journal_mode: 'WAL',
    synchronous: 'NORMAL',
    cache_size: -64000, // 64MB cache
    temp_store: 'MEMORY',
  },
  // 启用查询缓存
  cache: {
    duration: 30000, // 30秒缓存
    type: 'database',
  },
});