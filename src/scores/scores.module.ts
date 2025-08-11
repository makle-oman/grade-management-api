import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScoresController } from './scores.controller';
import { ScoresService } from './scores.service';
import { Score } from '../entities/score.entity';
import { ExamsModule } from '../exams/exams.module';
import { StudentsModule } from '../students/students.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Score]),
    ExamsModule,
    StudentsModule,
  ],
  controllers: [ScoresController],
  providers: [ScoresService],
  exports: [ScoresService],
})
export class ScoresModule {}