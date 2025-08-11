import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ExamsService } from './exams.service';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';

@Controller('exams')
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  async findAll(): Promise<Exam[]> {
    return this.examsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Exam> {
    return this.examsService.findOne(id);
  }

  @Get('class/:className')
  async findByClass(@Param('className') className: string): Promise<Exam[]> {
    return this.examsService.findByClass(className);
  }

  @Post()
  async create(@Body() createExamDto: CreateExamDto): Promise<Exam> {
    return this.examsService.create(createExamDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
  ): Promise<Exam> {
    return this.examsService.update(id, updateExamDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.examsService.remove(id);
  }
}