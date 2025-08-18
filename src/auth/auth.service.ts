import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entities/user.entity';
import { Class } from '../entities/class.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Class)
    private classRepository: Repository<Class>,
    private jwtService: JwtService,
  ) {}

  // 导入班级名称工具函数
  private normalizeClassName(className: string): string {
    // 从 classNameUtils.ts 中提取的标准化班级名称函数
    if (!className) return '';
    
    const { grade, classNumber } = this.parseClassName(className);
    const gradeInChinese = this.getGradeName(grade).replace('年级', '');
    return `${gradeInChinese}（${classNumber}）班`;
  }

  private parseClassName(className: string): { grade: number; classNumber: number } {
    if (!className) return { grade: 1, classNumber: 1 };
    
    const trimmed = className.trim();
    
    // 支持多种格式的正则表达式
    const patterns = [
      /^(\d+)-(\d+)$/, // 1-2 格式
      /^\((\d+)\)\s*班$/, // (1) 班 格式
      /^([一二三四五六七八九十])（(\d+)）班$/, // 一（1）班 格式
      /^([一二三四五六七八九十])年级(\d+)班$/, // 一年级1班 格式
      /^(\d+)年级(\d+)班$/, // 1年级1班 格式
      /^(\d+)班$/, // 1班 格式
    ];

    const chineseNumbers: { [key: string]: number } = {
      '一': 1, '二': 2, '三': 3, '四': 4, '五': 5, '六': 6,
      '七': 7, '八': 8, '九': 9, '十': 10
    };

    for (const pattern of patterns) {
      const match = trimmed.match(pattern);
      if (match) {
        let grade: number;
        let classNumber: number;
        
        if (pattern.source === '^(\\d+)-(\\d+)$') {
          // 1-2 格式
          grade = parseInt(match[1]);
          classNumber = parseInt(match[2]);
        } else if (pattern.source === '^\\((\\d+)\\)\\s*班$') {
          // (1) 班 格式，默认为一年级
          grade = 1;
          classNumber = parseInt(match[1]);
        } else if (pattern.source === '^([一二三四五六七八九十])（(\\d+)）班$') {
          // 一（1）班 格式
          grade = chineseNumbers[match[1]] || 1;
          classNumber = parseInt(match[2]);
        } else if (pattern.source === '^([一二三四五六七八九十])年级(\\d+)班$') {
          // 一年级1班 格式
          grade = chineseNumbers[match[1]] || 1;
          classNumber = parseInt(match[2]);
        } else if (pattern.source === '^(\\d+)年级(\\d+)班$') {
          // 1年级1班 格式
          grade = parseInt(match[1]);
          classNumber = parseInt(match[2]);
        } else if (pattern.source === '^(\\d+)班$') {
          // 1班 格式，默认为一年级
          grade = 1;
          classNumber = parseInt(match[1]);
        }
        
        return { grade: grade || 1, classNumber: classNumber || 1 };
      }
    }

    // 默认返回
    return { grade: 1, classNumber: 1 };
  }

  private getGradeName(grade: number): string {
    const gradeNames: { [key: number]: string } = {
      1: '一年级',
      2: '二年级', 
      3: '三年级',
      4: '四年级',
      5: '五年级',
      6: '六年级',
      7: '七年级',
      8: '八年级',
      9: '九年级'
    };
    
    return gradeNames[grade] || `${grade}年级`;
  }

  // 根据班级名称查找或创建班级
  private async findOrCreateClass(className: string, creatorName?: string): Promise<Class> {
    // 使用工具函数标准化班级名称
    const normalizedClassName = this.normalizeClassName(className);
    
    // 先查找是否已存在该班级
    let classEntity = await this.classRepository.findOne({
      where: { name: normalizedClassName }
    });

    if (!classEntity) {
      // 如果不存在，则创建新班级
      // 从班级名称中提取年级信息
      const { grade } = this.parseClassName(normalizedClassName);
      const gradeName = this.getGradeName(grade);
      
      const description = creatorName 
        ? `${creatorName}创建的班级：${normalizedClassName}`
        : `注册用户创建的班级：${normalizedClassName}`;
      
      classEntity = this.classRepository.create({
        name: normalizedClassName,
        grade: gradeName,
        description: description,
        isActive: true
      });
      
      classEntity = await this.classRepository.save(classEntity);
      console.log(`注册时自动创建班级: ${normalizedClassName} (ID: ${classEntity.id})`);
    }

    return classEntity;
  }

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { username },
      select: ['id', 'username', 'email', 'name', 'role', 'password', 'subject', 'classNames', 'isActive']
    });

    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('用户名或密码错误');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('账户已被禁用');
    }

    // 安全地解析 classNames
    let classNamesArray = [];
    try {
      if (user.classNames) {
        classNamesArray = typeof user.classNames === 'string' 
          ? JSON.parse(user.classNames) 
          : user.classNames;
      }
    } catch (e) {
      classNamesArray = user.classNames ? user.classNames.split(',') : [];
    }

    const payload = { 
      username: user.username, 
      sub: user.id, 
      role: user.role,
      subject: user.subject,
      classNames: classNamesArray
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        role: user.role,
        subject: user.subject,
        classNames: classNamesArray
      }
    };
  }

  async register(registerDto: RegisterDto) {
    // 检查用户名是否已存在
    const existingUserByUsername = await this.userRepository.findOne({
      where: { username: registerDto.username }
    });

    // 如果提供了邮箱，检查邮箱是否已存在
    let existingUserByEmail = null;
    if (registerDto.email && registerDto.email.length > 0) {
      existingUserByEmail = await this.userRepository.findOne({
        where: { email: registerDto.email }
      });
    }

    if (existingUserByUsername || existingUserByEmail) {
      throw new UnauthorizedException('用户名或邮箱已存在');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // 处理班级名称格式转换
    let processedClassNames = null;
    let normalizedClassNames = [];
    
    if (registerDto.classNames && registerDto.classNames.length > 0) {
      // 保存标准化的班级名称，用于创建班级记录
      normalizedClassNames = registerDto.classNames.map(className => this.normalizeClassName(className));
      
      // 将班级名称标准化后存储
      processedClassNames = JSON.stringify(normalizedClassNames);
      
      // 只有当角色是教师时才创建班级记录
      if (registerDto.role === 'teacher') {
        // 为每个班级创建班级记录
        for (const className of normalizedClassNames) {
          try {
            await this.findOrCreateClass(className, registerDto.name);
          } catch (error) {
            console.error(`注册时创建班级 ${className} 失败:`, error.message);
          }
        }
      } else {
        console.log(`用户 ${registerDto.username} 是年级组长，跳过创建班级`);
      }
    }
    
    // 创建用户实例
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      role: registerDto.role,
      subject: registerDto.subject,
      classNames: processedClassNames
    });

    const savedUser = await this.userRepository.save(user);
    
    // 安全地解析 classNames 用于返回
    let classNamesArray = [];
    try {
      if (savedUser.classNames) {
        classNamesArray = typeof savedUser.classNames === 'string' 
          ? JSON.parse(savedUser.classNames) 
          : savedUser.classNames;
      }
    } catch (e) {
      classNamesArray = savedUser.classNames ? savedUser.classNames.split(',') : [];
    }

    // 返回登录信息
    const payload = { 
      username: savedUser.username, 
      sub: savedUser.id, 
      role: savedUser.role,
      subject: savedUser.subject,
      classNames: classNamesArray
    };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: savedUser.id,
        username: savedUser.username,
        email: savedUser.email,
        name: savedUser.name,
        role: savedUser.role,
        subject: savedUser.subject,
        classNames: classNamesArray
      }
    };
  }

  async findById(id: string): Promise<any> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) return null;
    
    // 安全地解析 classNames
    let classNamesArray = [];
    try {
      if (user.classNames) {
        classNamesArray = typeof user.classNames === 'string' 
          ? JSON.parse(user.classNames) 
          : user.classNames;
      }
    } catch (e) {
      classNamesArray = user.classNames ? user.classNames.split(',') : [];
    }
    
    // 返回时不包含密码，并确保 classNames 是数组格式
    const { password, ...result } = user;
    return {
      ...result,
      classNames: classNamesArray
    };
  }

  async updateProfile(userId: string, updateData: { username: string; name: string; subject?: string; classNames?: string[] }): Promise<User> {
    // 检查新用户名是否已被其他用户使用
    if (updateData.username) {
      const existingUser = await this.userRepository.findOne({
        where: { username: updateData.username }
      });
      
      if (existingUser && existingUser.id !== userId) {
        throw new UnauthorizedException('手机号已被其他用户使用');
      }
    }

    // 处理 classNames 字段，将数组转换为 JSON 字符串
    const updateDataForDb: any = { ...updateData };
    if (updateData.classNames) {
      updateDataForDb.classNames = JSON.stringify(updateData.classNames);
    }

    await this.userRepository.update(userId, updateDataForDb);
    const updatedUser = await this.userRepository.findOne({ where: { id: userId } });
    
    // 安全地解析 classNames 用于返回
    let classNamesArray = [];
    try {
      if (updatedUser.classNames) {
        classNamesArray = typeof updatedUser.classNames === 'string' 
          ? JSON.parse(updatedUser.classNames) 
          : updatedUser.classNames;
      }
    } catch (e) {
      classNamesArray = updatedUser.classNames ? updatedUser.classNames.split(',') : [];
    }

    // 返回时不包含密码，并确保 classNames 是数组格式
    const { password, ...result } = updatedUser;
    return {
      ...result,
      classNames: classNamesArray
    } as unknown as User;
  }

  async changePassword(userId: string, passwordData: { currentPassword: string; newPassword: string }): Promise<void> {
    const user = await this.userRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'password']
    });

    if (!user) {
      throw new UnauthorizedException('用户不存在');
    }

    // 验证当前密码
    const isCurrentPasswordValid = await bcrypt.compare(passwordData.currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('当前密码错误');
    }

    // 加密新密码
    const hashedNewPassword = await bcrypt.hash(passwordData.newPassword, 10);
    
    // 更新密码
    await this.userRepository.update(userId, { password: hashedNewPassword });
  }
}
