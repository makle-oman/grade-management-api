import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';

@Injectable()
export class StudentsService {
  constructor(
    @InjectRepository(Student)
    private studentsRepository: Repository<Student>,
  ) {}

  async findAll(): Promise<Student[]> {
    return this.studentsRepository.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Student> {
    const student = await this.studentsRepository.findOne({ where: { id } });
    if (!student) {
      throw new NotFoundException(`学生ID ${id} 不存在`);
    }
    return student;
  }

  async findByClass(className: string): Promise<Student[]> {
    return this.studentsRepository.find({
      where: { className },
      order: { studentNumber: 'ASC' },
    });
  }

  async create(createStudentDto: CreateStudentDto): Promise<Student> {
    const student = this.studentsRepository.create(createStudentDto);
    return this.studentsRepository.save(student);
  }

  async update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student> {
    const student = await this.findOne(id);
    const updatedStudent = Object.assign(student, updateStudentDto);
    return this.studentsRepository.save(updatedStudent);
  }

  async remove(id: string): Promise<void> {
    const result = await this.studentsRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`学生ID ${id} 不存在`);
    }
  }

  async importMany(students: CreateStudentDto[]): Promise<Student[]> {
    const studentEntities = students.map(dto => this.studentsRepository.create(dto));
    return this.studentsRepository.save(studentEntities);
  }
}