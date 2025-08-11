import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Injectable()
export class ExamsService {
  constructor(
    @InjectRepository(Exam)
    private examsRepository: Repository<Exam>,
  ) {}

  async findAll(): Promise<Exam[]> {
    return this.examsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Exam> {
    const exam = await this.examsRepository.findOne({ where: { id } });
    if (!exam) {
      throw new NotFoundException(`考试ID ${id} 不存在`);
    }
    return exam;
  }

  async findByClass(className: string): Promise<Exam[]> {
    return this.examsRepository.find({
      where: { className },
      order: { examDate: 'DESC' },
    });
  }

  async create(createExamDto: CreateExamDto): Promise<Exam> {
    const exam = this.examsRepository.create(createExamDto);
    return this.examsRepository.save(exam);
  }

  async update(id: string, updateExamDto: UpdateExamDto): Promise<Exam> {
    const exam = await this.findOne(id);
    const updatedExam = Object.assign(exam, updateExamDto);
    return this.examsRepository.save(updatedExam);
  }

  async remove(id: string): Promise<void> {
    const result = await this.examsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`考试ID ${id} 不存在`);
    }
  }
}