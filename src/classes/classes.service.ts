import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Class } from '../entities/class.entity';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class ClassesService {
  constructor(
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(createClassDto: CreateClassDto): Promise<Class> {
    const classEntity = this.classRepository.create({
      ...createClassDto,
      isActive: createClassDto.isActive ?? true,
    });
    return await this.classRepository.save(classEntity);
  }

  async findAll(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Class[]> {
    // 根据用户角色过滤数据
    if (userRole === UserRole.TEACHER) {
      // 普通教师只能看到自己负责的班级
      if (userClassNames && userClassNames.length > 0) {
        // 获取教师负责的班级
        return await this.classRepository.find({
          where: { name: In(userClassNames) },
          relations: ['students'],
          order: { createdAt: 'DESC' },
        });
      } else {
        // 如果教师没有分配班级，则不显示任何班级
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
      // 普通教师只能看到自己负责的班级
      if (userClassNames && userClassNames.length > 0) {
        return await this.classRepository.find({
          where: { 
            name: In(userClassNames),
            isActive: true 
          },
          relations: ['students'],
          order: { createdAt: 'DESC' },
        });
      } else {
        // 如果教师没有分配班级，则不应该看到任何班级
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

  async update(id: number, updateClassDto: UpdateClassDto): Promise<Class> {
    const classEntity = await this.findOne(id);
    Object.assign(classEntity, updateClassDto);
    return await this.classRepository.save(classEntity);
  }

  async remove(id: number): Promise<void> {
    const classEntity = await this.findOne(id);
    await this.classRepository.remove(classEntity);
  }

  async toggleActive(id: number): Promise<Class> {
    const classEntity = await this.findOne(id);
    classEntity.isActive = !classEntity.isActive;
    return await this.classRepository.save(classEntity);
  }
}