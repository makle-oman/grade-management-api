import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ClassesService } from './classes.service';
import { ClassesController } from './classes.controller';
import { Class } from '../entities/class.entity';
import { Exam } from '../entities/exam.entity';
import { Score } from '../entities/score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Class, Exam, Score])],
  controllers: [ClassesController],
  providers: [ClassesService],
  exports: [ClassesService],
})
export class ClassesModule {}
