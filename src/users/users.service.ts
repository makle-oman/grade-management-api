import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Student } from '../entities/student.entity';
import { Score } from '../entities/score.entity';
import { Exam } from '../entities/exam.entity';
import { Class } from '../entities/class.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { parseDisplayClassName, formatClassName, normalizeClassName, extractGradeFromClassName } from '../utils/classNameUtils';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    // 处理班级名称格式转换
    let processedClassNames = null;
    let normalizedClassNames = [];
    
    if (createUserDto.classNames && Array.isArray(createUserDto.classNames)) {
      // 保存标准化的班级名称，用于创建班级记录
      normalizedClassNames = createUserDto.classNames.map(className => normalizeClassName(className));
      
      // 将前端格式 "(1) 班" 转换为存储格式 "1-1"
      const convertedClassNames = createUserDto.classNames.map(className => {
        return normalizeClassName(className);
      });
      
      processedClassNames = JSON.stringify(convertedClassNames);
      
      // 为每个班级创建班级记录
      for (const className of normalizedClassNames) {
        // 检查班级是否已存在
        const existingClass = await this.classRepository.findOne({
          where: { name: className }
        });
        
        // 如果班级不存在，则创建
        if (!existingClass) {
          // 从班级名称中提取年级信息
          const grade = extractGradeFromClassName(className);
          
          const newClass = this.classRepository.create({
            name: className,
            grade: grade,
            description: `${createUserDto.name || createUserDto.username}创建的班级：${className}`,
            isActive: true
          });
          
          await this.classRepository.save(newClass);
          console.log(`用户创建时自动创建班级: ${className}`);
        }
      }
    }
    
    // 创建用户，确保班级名称被正确保存
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      classNames: processedClassNames
    });

    const savedUser = await this.userRepository.save(user);
    const { password, ...result } = savedUser;
    return result as User;
  }

  async findAll(): Promise<User[]> {
    return this.userRepository.find({
      select: ['id', 'username', 'email', 'name', 'role', 'subject', 'classNames', 'isActive', 'createdAt']
    });
  }

  async findOne(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      select: ['id', 'username', 'email', 'name', 'role', 'subject', 'classNames', 'isActive', 'createdAt']
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findByUsername(username: string): Promise<User> {
    return this.userRepository.findOne({
      where: { username },
      select: ['id', 'username', 'email', 'name', 'role', 'subject', 'classNames', 'isActive', 'createdAt']
    });
  }

  async findTeachersByRole(role: UserRole): Promise<User[]> {
    return this.userRepository.find({
      where: { role, isActive: true },
      select: ['id', 'username', 'email', 'name', 'role', 'subject', 'classNames']
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);
    
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 10);
    }

    // 创建一个新对象来存储更新数据
    const updateData: any = { ...updateUserDto };
    
    // 处理 classNames 字段，将前端格式转换为存储格式
    if (updateData.classNames) {
      // 确保 classNames 是数组格式
      const classNamesArray = Array.isArray(updateData.classNames) 
        ? updateData.classNames 
        : [updateData.classNames];
      
      // 将前端格式 "(1) 班" 转换为存储格式 "1-1"
      const convertedClassNames = classNamesArray.map(className => {
        return parseDisplayClassName(className);
      });
      
      // 为每个班级创建班级记录
      for (const className of classNamesArray) {
        // 标准化班级名称
        const normalizedClassName = normalizeClassName(className);
        
        // 检查班级是否已存在
        const existingClass = await this.classRepository.findOne({
          where: { name: normalizedClassName }
        });
        
        // 如果班级不存在，则创建
        if (!existingClass) {
          // 从班级名称中提取年级信息
          const grade = extractGradeFromClassName(normalizedClassName);
          
          const newClass = this.classRepository.create({
            name: normalizedClassName,
            grade: grade,
            description: `用户更新时自动创建班级：${normalizedClassName}`,
            isActive: true
          });
          
          await this.classRepository.save(newClass);
          console.log(`用户更新时自动创建班级: ${normalizedClassName}`);
        }
      }
      
      // 删除原始的 classNames 数组
      delete updateData.classNames;
      // 添加为字符串格式
      updateData.classNames = JSON.stringify(convertedClassNames);
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
    
    // 将关联数据的外键设为NULL，而不是删除关联数据
    // 这样学生、成绩、考试记录都会保留，但不再关联到被删除的用户
    await this.studentRepository.update({ teacher: { id } }, { teacher: null });
    await this.scoreRepository.update({ user: { id } }, { user: null });
    await this.examRepository.update({ teacher: { id } }, { teacher: null });
    
    // 删除用户
    await this.userRepository.remove(user);
  }

  async toggleActive(id: string): Promise<User> {
    const user = await this.findOne(id);
    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return user;
  }

  async resetPassword(id: string): Promise<{ message: string }> {
    const user = await this.userRepository.findOne({ where: { id } });
    
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 将密码重置为888888并加密
    const hashedPassword = await bcrypt.hash('888888', 10);
    await this.userRepository.update(id, { password: hashedPassword });
    
    return { message: '密码已重置为888888' };
  }
}
