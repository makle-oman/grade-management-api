import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { Student } from '../entities/student.entity';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { Score } from '../entities/score.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Student, Class, User, Score])],
  controllers: [StudentsController],
  providers: [StudentsService],
  exports: [StudentsService],
})
export class StudentsModule {}
