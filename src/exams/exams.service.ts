import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examsRepository: Repository<Exam>,
  ) {}

  async findAll(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Exam[]> {
    let whereCondition = {};
    
    // 根据用户角色过滤数据
    if (userRole === UserRole.TEACHER) {
      // 普通教师只能看到自己的考试
      if (userClassNames?.length > 0) {
        whereCondition = { className: In(userClassNames) };
      } else {
        whereCondition = { teacherId: userId };
      }
    }
    // 管理员和年级组长可以看到所有数据，不添加额外的where条件

    return this.examsRepository.find({
      where: whereCondition,
      relations: ['teacher', 'semester'],
      order: { examDate: 'DESC' },
    });
  }

  async findOne(id: string, userId?: string, userRole?: UserRole): Promise<Exam> {
    const exam = await this.examsRepository.findOne({ 
      where: { id },
      relations: ['teacher', 'semester']
    });
    
    if (!exam) {
      throw new NotFoundException(`考试ID ${id} 不存在`);
    }

    // 权限检查
    if (userRole === UserRole.TEACHER && exam.teacherId !== userId) {
      throw new ForbiddenException('您没有权限访问此考试信息');
    }

    return exam;
  }

  async findByClass(className: string, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Exam[]> {
    // 权限检查
    if (userRole === UserRole.TEACHER && userClassNames && !userClassNames.includes(className)) {
      throw new ForbiddenException('您没有权限访问此班级考试信息');
    }

    return this.examsRepository.find({
      where: { className },
      relations: ['teacher', 'semester'],
      order: { examDate: 'DESC' },
    });
  }

  async findByTeacher(teacherId: string): Promise<Exam[]> {
    return this.examsRepository.find({
      where: { teacherId },
      relations: ['teacher', 'semester'],
      order: { examDate: 'DESC' },
    });
  }

  async findBySemester(semesterId: string, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Exam[]> {
    let whereCondition: any = { semesterId };
    
    // 根据用户角色过滤数据
    if (userRole === UserRole.TEACHER) {
      // 普通教师只能看到自己的考试
      if (userClassNames?.length > 0) {
        whereCondition.className = In(userClassNames);
      } else {
        whereCondition.teacherId = userId;
      }
    }
    // 管理员和年级组长可以看到所有数据，不添加额外的where条件

    return this.examsRepository.find({
      where: whereCondition,
      relations: ['teacher', 'semester'],
      order: { examDate: 'DESC' },
    });
  }

  async create(createExamDto: CreateExamDto, teacherId?: string): Promise<Exam> {
    const exam = this.examsRepository.create({
      ...createExamDto,
      teacherId
    });
    return this.examsRepository.save(exam);
  }

  async update(id: string, updateExamDto: UpdateExamDto, userId?: string, userRole?: UserRole): Promise<Exam> {
    const exam = await this.findOne(id, userId, userRole);
    const updatedExam = Object.assign(exam, updateExamDto);
    return this.examsRepository.save(updatedExam);
  }

  async remove(id: string, userId?: string, userRole?: UserRole): Promise<void> {
    const exam = await this.findOne(id, userId, userRole);
    await this.examsRepository.remove(exam);
  }

  // 统计方法
  async getExamStatistics(examId: string, userId?: string, userRole?: UserRole) {
    const exam = await this.findOne(examId, userId, userRole);
    
    // 这里可以添加考试统计逻辑
    // 比如计算平均分、及格率等
    return {
      exam,
      // 其他统计数据...
    };
  }
}
