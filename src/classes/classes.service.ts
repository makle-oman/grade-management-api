import { Injectable, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Class } from '../entities/class.entity';
import { Exam } from '../entities/exam.entity';
import { Score } from '../entities/score.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UserRole } from '../entities/user.entity';
import { parseClassName, getGradeName } from '../utils/classNameUtils';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
  ) {}

  async create(createClassDto: CreateClassDto, userId?: string): Promise<Class> {
    const classData = {
      ...createClassDto,
      isActive: createClassDto.isActive ?? true,
    };
    
    if (userId) {
      classData['createdBy'] = userId;
    }
    
    const classEntity = this.classRepository.create(classData);
    return await this.classRepository.save(classEntity);
  }

  async findAll(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Class[]> {
    // 根据用户角色过滤数据
    if (userRole === UserRole.TEACHER) {
      // 普通教师可以看到自己负责的班级和自己创建的班级
      const whereConditions = [];
      
      // 添加自己创建的班级条件
      if (userId) {
        whereConditions.push({ createdBy: userId });
      }
      
      // 添加自己负责的班级条件
      if (userClassNames && userClassNames.length > 0) {
        whereConditions.push({ name: In(userClassNames) });
      }
      
      if (whereConditions.length > 0) {
        return await this.classRepository.find({
          where: whereConditions,
          relations: ['students'],
          order: { createdAt: 'DESC' },
        });
      } else {
        // 如果教师既没有创建班级也没有分配班级，则不显示任何班级
        return [];
      }
    } else {
      // 管理员和年级组长可以看到所有班级
      return await this.classRepository.find({
        relations: ['students'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findActive(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Class[]> {
    // 根据用户角色过滤数据
    if (userRole === UserRole.TEACHER) {
      // 普通教师可以看到自己负责的班级和自己创建的班级
      const whereConditions = [];
      
      // 添加自己创建的班级条件
      if (userId) {
        whereConditions.push({ createdBy: userId, isActive: true });
      }
      
      // 添加自己负责的班级条件
      if (userClassNames && userClassNames.length > 0) {
        whereConditions.push({ name: In(userClassNames), isActive: true });
      }
      
      if (whereConditions.length > 0) {
        return await this.classRepository.find({
          where: whereConditions,
          relations: ['students'],
          order: { createdAt: 'DESC' },
        });
      } else {
        // 如果教师既没有创建班级也没有分配班级，则不显示任何班级
        return [];
      }
    } else {
      // 管理员和年级组长可以看到所有活跃班级
      return await this.classRepository.find({
        where: { isActive: true },
        relations: ['students'],
        order: { createdAt: 'DESC' },
      });
    }
  }

  async findOne(id: number, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['students'],
    });
    
    if (!classEntity) {
      throw new NotFoundException(`班级 ID ${id} 不存在`);
    }
    
    // 权限检查
    if (userRole === UserRole.TEACHER) {
      // 普通教师只能查看自己负责的班级
      if (!userClassNames || !userClassNames.includes(classEntity.name)) {
        throw new ForbiddenException('您没有权限访问此班级信息');
      }
    }
    
    return classEntity;
  }

  async update(id: number, updateClassDto: UpdateClassDto, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['students']
    });

    if (!classEntity) {
      throw new NotFoundException(`班级 ID ${id} 不存在`);
    }

    // 权限检查：教师只能编辑自己负责的班级
    if (userRole === UserRole.TEACHER) {
      if (!userClassNames || !userClassNames.includes(classEntity.name)) {
        throw new ForbiddenException('您没有权限编辑此班级');
      }
    }

    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  async remove(id: number, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<void> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['students']
    });

    if (!classEntity) {
      throw new NotFoundException('班级不存在');
    }

    // 权限检查：教师只能删除自己负责的班级
    if (userRole === UserRole.TEACHER) {
      if (!userClassNames || !userClassNames.includes(classEntity.name)) {
        throw new ForbiddenException('您没有权限删除此班级');
      }
    }
    // 管理员和年级组长可以删除任何班级

    // 检查是否有学生
    if (classEntity.students && classEntity.students.length > 0) {
      throw new BadRequestException('该班级下还有学生，无法删除');
    }

    // 删除班级下的所有考试及其相关成绩
    const exams = await this.examRepository.find({
      where: { className: classEntity.name }
    });

    for (const exam of exams) {
      // 先删除考试相关的成绩
      await this.scoreRepository.delete({ examId: exam.id });
      // 再删除考试
      await this.examRepository.remove(exam);
    }

    // 最后删除班级
    await this.classRepository.remove(classEntity);
  }

  async toggleActive(id: number, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Class> {
    const classEntity = await this.classRepository.findOne({
      where: { id },
      relations: ['students']
    });

    if (!classEntity) {
      throw new NotFoundException(`班级 ID ${id} 不存在`);
    }

    // 权限检查：教师只能切换自己负责的班级状态
    if (userRole === UserRole.TEACHER) {
      if (!userClassNames || !userClassNames.includes(classEntity.name)) {
        throw new ForbiddenException('您没有权限操作此班级');
      }
    }

    classEntity.isActive = !classEntity.isActive;
    return await this.classRepository.save(classEntity);
  }
}