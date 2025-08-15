import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Score } from '../entities/score.entity';
import { Exam } from '../entities/exam.entity';
import { Class } from '../entities/class.entity';

@Module({
  imports: [TypeOrmModule.forFeature([User, Student, Score, Exam, Class])],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
