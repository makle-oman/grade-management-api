import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottlerModule } from '@nestjs/throttler';
import { StudentsModule } from './students/students.module';
import { ExamsModule } from './exams/exams.module';
import { ScoresModule } from './scores/scores.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SemestersModule } from './semesters/semesters.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ClassesModule } from './classes/classes.module';
import { getDatabaseConfig } from './config/database.config';
import { getRedisConfig } from './config/redis.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    // 数据库配置优化
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getDatabaseConfig,
    }),
    // 缓存模块
    CacheModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getRedisConfig,
      isGlobal: true,
    }),
    // API限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1分钟
        limit: 100, // 每分钟最多100个请求
      },
    ]),
    AuthModule,
    UsersModule,
    SemestersModule,
    ClassesModule,
    StudentsModule,
    ExamsModule,
    ScoresModule,
    StatisticsModule,
  ],
})
export class AppModule {}