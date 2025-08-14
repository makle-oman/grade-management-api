import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Semester } from '../entities/semester.entity';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';

@Injectable()
export class SemestersService {
  constructor(
    @InjectRepository(Semester)
    private semesterRepository: Repository<Semester>,
  ) {}

  async create(createSemesterDto: CreateSemesterDto): Promise<Semester> {
    // 如果设置为当前学期，先将其他学期设为非当前
    if (createSemesterDto.isCurrent) {
      await this.semesterRepository
        .createQueryBuilder()
        .update(Semester)
        .set({ isCurrent: false })
        .execute();
    }

    const semester = this.semesterRepository.create(createSemesterDto);
    return this.semesterRepository.save(semester);
  }

  async findAll(): Promise<Semester[]> {
    return this.semesterRepository.find({
      order: { startDate: 'DESC' }
    });
  }

  async findOne(id: string): Promise<Semester> {
    const semester = await this.semesterRepository.findOne({ where: { id } });
    if (!semester) {
      throw new NotFoundException('学期不存在');
    }
    return semester;
  }

  async findCurrent(): Promise<Semester> {
    const semester = await this.semesterRepository.findOne({ 
      where: { isCurrent: true } 
    });
    if (!semester) {
      throw new NotFoundException('未设置当前学期');
    }
    return semester;
  }

  async update(id: string, updateSemesterDto: UpdateSemesterDto): Promise<Semester> {
    const semester = await this.findOne(id);
    
    // 如果设置为当前学期，先将其他学期设为非当前
    if (updateSemesterDto.isCurrent) {
      await this.semesterRepository
        .createQueryBuilder()
        .update(Semester)
        .set({ isCurrent: false })
        .execute();
    }

    // 使用 save 方法而不是 update 方法，避免空条件错误
    Object.assign(semester, updateSemesterDto);
    await this.semesterRepository.save(semester);
    
    return this.findOne(id);
  }

  async remove(id: string): Promise<void> {
    const semester = await this.findOne(id);
    await this.semesterRepository.remove(semester);
  }

  async setCurrent(id: string): Promise<Semester> {
    // 先将所有学期设为非当前
    await this.semesterRepository
      .createQueryBuilder()
      .update(Semester)
      .set({ isCurrent: false })
      .execute();
    
    // 设置指定学期为当前
    const semester = await this.findOne(id);
    semester.isCurrent = true;
    await this.semesterRepository.save(semester);
    
    return semester;
  }
}