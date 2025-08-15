import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
    
    const user = this.userRepository.create({
      ...createUserDto,
      password: hashedPassword,
      classNames: createUserDto.classNames ? JSON.stringify(createUserDto.classNames) : null
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
    
    // 处理 classNames 字段，将数组转换为 JSON 字符串
    if (updateData.classNames) {
      // 确保 classNames 是数组格式
      const classNamesArray = Array.isArray(updateData.classNames) 
        ? updateData.classNames 
        : [updateData.classNames];
      // 删除原始的 classNames 数组
      delete updateData.classNames;
      // 添加为字符串格式
      updateData.classNames = JSON.stringify(classNamesArray);
    }

    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const user = await this.findOne(id);
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
