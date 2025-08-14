import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UserRole } from '../entities/user.entity';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  private async findOrCreateClass(className: string, teacherId?: string): Promise<Class> {
    // 先查找是否已存在该班级
    let classEntity = await this.classRepository.findOne({
      where: { name: className }
    });

    if (!classEntity) {
      // 如果不存在，则创建新班级
      // 从班级名称中提取年级信息，如"六（2）班" -> "六年级"
      const gradeMatch = className.match(/^([一二三四五六七八九十]+)/);
      const grade = gradeMatch ? `${gradeMatch[1]}年级` : '未知年级';
      
      classEntity = this.classRepository.create({
        name: className,
        grade: grade,
        description: `自动创建的班级：${className}`,
        isActive: true
      });
      
      classEntity = await this.classRepository.save(classEntity);
      console.log(`自动创建班级: ${className} (ID: ${classEntity.id})`);
      
      // 如果提供了教师ID，将新创建的班级添加到教师的班级列表中
      if (teacherId) {
        await this.addClassToTeacher(teacherId, className);
      }
    }

    return classEntity;
  }
  
  // 添加班级到教师的班级列表
  private async addClassToTeacher(teacherId: string, className: string): Promise<void> {
    try {
      // 获取教师信息
      const teacher = await this.userRepository.findOne({
        where: { id: teacherId }
      });
      
      if (teacher) {
        // 解析现有的班级列表
        let classNames: string[] = [];
        try {
          classNames = teacher.classNames ? JSON.parse(teacher.classNames) : [];
        } catch (e) {
          classNames = teacher.classNames ? teacher.classNames.split(',') : [];
        }
        
        // 如果班级不在列表中，添加它
        if (!classNames.includes(className)) {
          classNames.push(className);
          
          // 更新教师的班级列表
          await this.userRepository.update(teacherId, {
            classNames: JSON.stringify(classNames)
          });
          
          console.log(`已将班级 ${className} 添加到教师 ${teacher.name} 的班级列表中`);
        }
      }
    } catch (error) {
      console.error(`将班级添加到教师失败:`, error.message);
    }
  }

  async findAll(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]> {
    // 根据用户角色过滤数据
    if (userRole === UserRole.TEACHER) {
      // 普通教师只能看到自己创建的学生
      const results = await this.studentsRepository.find({
        where: { teacherId: userId },
        relations: ['teacher', 'class'],
        order: { studentNumber: 'ASC' },
      });
      
      return results.filter(student => !student.class || student.class.isActive);
      
    } else if (userRole === UserRole.GRADE_LEADER || userRole === UserRole.ADMIN) {
      // 管理员和年级组长可以看到所有数据
      const results = await this.studentsRepository.find({
        relations: ['teacher', 'class'],
        order: { studentNumber: 'ASC' },
      });
      
      return results.filter(student => !student.class || student.class.isActive);
      
    } else {
      // 未知角色，不返回任何数据
      return [];
    }
  }

  async findOne(id: string, userId?: string, userRole?: UserRole): Promise<Student> {
    const student = await this.studentsRepository.findOne({ 
      where: { id },
      relations: ['teacher']
    });
    
    if (!student) {
      throw new NotFoundException(`学生ID ${id} 不存在`);
    }

    // 权限检查
    if (userRole === UserRole.TEACHER && student.teacherId !== userId) {
      throw new ForbiddenException('您没有权限访问此学生信息');
    }

    return student;
  }

  async findByClass(className: string, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]> {
    // 获取所有学生，包括班级关系
    const students = await this.studentsRepository.find({
      relations: ['teacher', 'class'],
      order: { studentNumber: 'ASC' },
    });
    
    // 过滤出指定班级的学生
    const classStudents = students.filter(student => 
      student.class && student.class.name === className
    );
    
    // 权限检查
    if (userRole === UserRole.TEACHER) {
      if (userClassNames && !userClassNames.includes(className)) {
        // 如果教师没有负责这个班级，则只能看到自己创建的学生
        return classStudents.filter(student => student.teacherId === userId);
      }
    }

    // 管理员、年级组长或负责该班级的教师可以看到该班级的所有学生
    return classStudents;
  }

  async findByClassId(classId: number, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]> {
    // 先获取班级信息，检查班级名称是否在教师负责的班级列表中
    const classEntity = await this.classRepository.findOne({
      where: { id: classId }
    });
    
    if (!classEntity) {
      throw new NotFoundException(`班级ID ${classId} 不存在`);
    }
    
    // 获取所有学生，包括班级关系
    const students = await this.studentsRepository.find({
      relations: ['teacher', 'class'],
      order: { studentNumber: 'ASC' },
    });
    
    // 过滤出指定班级的学生，并且过滤掉停用班级的学生
    const classStudents = students.filter(student => 
      student.class && 
      student.class.id === classId && 
      student.class.isActive
    );
    
    // 权限检查
    if (userRole === UserRole.TEACHER) {
      if (userClassNames && !userClassNames.includes(classEntity.name)) {
        // 如果教师没有负责这个班级，则只能看到自己创建的学生
        return classStudents.filter(student => student.teacherId === userId);
      }
    }

    // 管理员、年级组长或负责该班级的教师可以看到该班级的所有学生
    return classStudents;
  }

  async findByTeacher(teacherId: string): Promise<Student[]> {
    const students = await this.studentsRepository.find({
      where: { teacherId },
      relations: ['teacher', 'class'],
      order: { studentNumber: 'ASC' },
    });

    // 过滤掉停用班级的学生
    return students.filter(student => !student.class || student.class.isActive);
  }

  async create(createStudentDto: CreateStudentDto, teacherId?: string): Promise<Student> {
    const student = this.studentsRepository.create({
      ...createStudentDto,
      teacherId
    });
    return this.studentsRepository.save(student);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto, userId?: string, userRole?: UserRole): Promise<Student> {
    const student = await this.findOne(id, userId, userRole);
    const updatedStudent = Object.assign(student, updateStudentDto);
    return this.studentsRepository.save(updatedStudent);
  }

  async remove(id: string, userId?: string, userRole?: UserRole): Promise<void> {
    const student = await this.findOne(id, userId, userRole);
    await this.studentsRepository.remove(student);
  }

  async batchRemove(ids: string[], userId?: string, userRole?: UserRole): Promise<void> {
    // 验证所有学生的权限
    for (const id of ids) {
      await this.findOne(id, userId, userRole);
    }
    
    // 批量删除
    await this.studentsRepository.delete(ids);
  }

  async importMany(students: CreateStudentDto[], teacherId: string): Promise<Student[]> {
    const results: Student[] = [];
    
    // 逐个处理每个学生，避免批量操作时的唯一约束冲突
    for (const studentDto of students) {
      try {
        // 自动查找或创建班级，并将班级关联到当前教师
        const classEntity = await this.findOrCreateClass(studentDto.className, teacherId);
        
        // 检查是否已存在相同学号和姓名的学生（在同一班级内检查）
        const existingStudentWithSameNumberAndName = await this.studentsRepository.findOne({
          where: { 
            studentNumber: studentDto.studentNumber,
            name: studentDto.name,
            classId: classEntity.id
          }
        });
        
        if (existingStudentWithSameNumberAndName) {
          // 如果学生已存在（学号、姓名、班级都相同），则跳过
          console.log(`学生 ${studentDto.name} (学号: ${studentDto.studentNumber}) 在班级 ${classEntity.name} 中已存在，跳过导入`);
          continue;
        }
        
        // 检查是否已存在相同学号的学生（在同一班级内检查）
        const existingStudentWithSameNumber = await this.studentsRepository.findOne({
          where: { 
            studentNumber: studentDto.studentNumber,
            classId: classEntity.id
          }
        });
        
        let finalStudentNumber = studentDto.studentNumber;
        
        if (existingStudentWithSameNumber) {
          // 如果学号已存在但姓名不同，在该班级内生成新的学号
          const existingClassStudents = await this.studentsRepository.find({
            where: { classId: classEntity.id },
            order: { studentNumber: 'DESC' }
          });
          
          let maxClassStudentNumber = 0;
          if (existingClassStudents.length > 0) {
            for (const student of existingClassStudents) {
              const numberStr = student.studentNumber;
              const number = parseInt(numberStr) || 0;
              if (number > maxClassStudentNumber) {
                maxClassStudentNumber = number;
              }
            }
          }
          
          maxClassStudentNumber++;
          finalStudentNumber = maxClassStudentNumber.toString();
          console.log(`学号 ${studentDto.studentNumber} 在班级 ${classEntity.name} 中已存在，为学生 ${studentDto.name} 分配新学号: ${finalStudentNumber}`);
        }
        
        // 检查是否存在同名同班级的学生，如果存在则关联到当前教师
        const existingStudentWithSameName = await this.studentsRepository.findOne({
          where: { 
            name: studentDto.name,
            classId: classEntity.id
          }
        });
        
        if (existingStudentWithSameName && !existingStudentWithSameName.teacherId) {
          // 如果存在同名学生且没有关联教师，则关联到当前教师
          existingStudentWithSameName.teacherId = teacherId;
          const updatedStudent = await this.studentsRepository.save(existingStudentWithSameName);
          results.push(updatedStudent);
          console.log(`关联现有学生 ${studentDto.name} 到当前教师`);
          continue;
        }
        
        // 创建新学生
        const newStudent = this.studentsRepository.create({
          ...studentDto,
          studentNumber: finalStudentNumber,
          classId: classEntity.id,
          teacherId
        });
        
        const savedStudent = await this.studentsRepository.save(newStudent);
        results.push(savedStudent);
        console.log(`创建学生: ${studentDto.name} (学号: ${finalStudentNumber}) -> 班级: ${classEntity.name}`);
        
      } catch (error) {
        console.error(`导入学生 ${studentDto.name} (学号: ${studentDto.studentNumber}) 时出错:`, error.message);
        // 继续处理下一个学生，不中断整个导入过程
      }
    }
    
    return results;
  }

  // 查询所有学生（包括停用班级的学生，供管理员使用）
  async findAllIncludingInactive(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]> {
    // 根据用户角色过滤数据
    if (userRole === UserRole.TEACHER) {
      if (userClassNames?.length > 0) {
        // 教师可以看到自己负责的班级的学生或自己创建的学生
        const students = await this.studentsRepository.find({
          relations: ['teacher', 'class'],
          order: { studentNumber: 'ASC' },
        });
        
        // 过滤：学生班级在教师负责的班级列表中，或者学生的教师ID等于当前用户ID
        return students.filter(student => 
          (student.class && userClassNames.includes(student.class.name)) || 
          student.teacherId === userId
        );
      } else {
        // 如果教师没有分配班级，则只能看到自己创建的学生
        return this.studentsRepository.find({
          where: { teacherId: userId },
          relations: ['teacher', 'class'],
          order: { studentNumber: 'ASC' },
        });
      }
    } else {
      // 管理员和年级组长可以看到所有学生
      return this.studentsRepository.find({
        relations: ['teacher', 'class'],
        order: { studentNumber: 'ASC' },
      });
    }
  }

  // 批量关联现有学生到班级
  async batchAssociateToClasses(): Promise<number> {
    const students = await this.studentsRepository.find();
    let updatedCount = 0;

    for (const student of students) {
      if (student.className && !student.classId) {
        try {
          const classEntity = await this.findOrCreateClass(student.className);
          await this.studentsRepository.update(student.id, { classId: classEntity.id });
          updatedCount++;
        } catch (error) {
          console.error(`关联学生 ${student.name} 到班级失败:`, error.message);
        }
      }
    }

    return updatedCount;
  }
}