import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsModule } from './students/students.module';
import { ExamsModule } from './exams/exams.module';
import { ScoresModule } from './scores/scores.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { SemestersModule } from './semesters/semesters.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ClassesModule } from './classes/classes.module';
import { join } from 'path';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'sqlite',
        database: configService.get('DB_FILE', join(__dirname, '..', 'data', 'grade_management.sqlite')),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: configService.get<boolean>('DB_SYNC', true),
      }),
    }),
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
