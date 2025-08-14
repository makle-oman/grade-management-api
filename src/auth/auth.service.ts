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

  // 根据班级名称查找或创建班级
  private async findOrCreateClass(className: string): Promise<Class> {
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
        description: `注册时自动创建的班级：${className}`,
        isActive: true
      });
      
      classEntity = await this.classRepository.save(classEntity);
      console.log(`注册时自动创建班级: ${className} (ID: ${classEntity.id})`);
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

    // 如果用户选择了班级，自动创建这些班级
    if (registerDto.classNames && registerDto.classNames.length > 0) {
      for (const className of registerDto.classNames) {
        try {
          await this.findOrCreateClass(className);
        } catch (error) {
          console.error(`注册时创建班级 ${className} 失败:`, error.message);
        }
      }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);
    
    // 创建用户实例
    const user = this.userRepository.create({
      username: registerDto.username,
      email: registerDto.email,
      password: hashedPassword,
      name: registerDto.name,
      role: registerDto.role,
      subject: registerDto.subject,
      classNames: registerDto.classNames ? JSON.stringify(registerDto.classNames) : null
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
