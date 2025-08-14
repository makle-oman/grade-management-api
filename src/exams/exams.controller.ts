import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExamsService } from './exams.service';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('exams')
@UseGuards(AuthGuard('jwt'))
export class ExamsController {
  constructor(private readonly examsService: ExamsService) {}

  @Get()
  async findAll(@Request() req): Promise<Exam[]> {
    const { userId, role, classNames } = req.user;
    return this.examsService.findAll(userId, role, classNames);
  }

  @Get('by-teacher/:teacherId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GRADE_LEADER)
  async findByTeacher(@Param('teacherId') teacherId: string): Promise<Exam[]> {
    return this.examsService.findByTeacher(teacherId);
  }

  @Get('by-semester/:semesterId')
  async findBySemester(@Param('semesterId') semesterId: string, @Request() req): Promise<Exam[]> {
    const { userId, role, classNames } = req.user;
    return this.examsService.findBySemester(semesterId, userId, role, classNames);
  }

  @Get('class/:className')
  async findByClass(@Param('className') className: string, @Request() req): Promise<Exam[]> {
    const { userId, role, classNames } = req.user;
    return this.examsService.findByClass(className, userId, role, classNames);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Exam> {
    const { userId, role } = req.user;
    return this.examsService.findOne(id, userId, role);
  }

  @Get(':id/statistics')
  async getStatistics(@Param('id') id: string, @Request() req) {
    const { userId, role } = req.user;
    return this.examsService.getExamStatistics(id, userId, role);
  }

  @Post()
  async create(@Body() createExamDto: CreateExamDto, @Request() req): Promise<Exam> {
    const { userId } = req.user;
    return this.examsService.create(createExamDto, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExamDto: UpdateExamDto,
    @Request() req
  ): Promise<Exam> {
    const { userId, role } = req.user;
    return this.examsService.update(id, updateExamDto, userId, role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const { userId, role } = req.user;
    return this.examsService.remove(id, userId, role);
  }
}
