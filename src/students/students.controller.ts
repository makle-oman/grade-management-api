import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, Request, Query, Patch, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StudentsService } from './students.service';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('students')
@UseGuards(AuthGuard('jwt'))
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll(@Request() req): Promise<Student[]> {
    const { userId, role, classNames } = req.user;
    return this.studentsService.findAll(userId, role, classNames);
  }

  @Get('all-including-inactive')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  async findAllIncludingInactive(@Request() req): Promise<Student[]> {
    const { userId, role, classNames } = req.user;
    return this.studentsService.findAllIncludingInactive(userId, role, classNames);
  }

  @Get('by-teacher/:teacherId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GRADE_LEADER)
  async findByTeacher(@Param('teacherId') teacherId: string): Promise<Student[]> {
    return this.studentsService.findByTeacher(teacherId);
  }

  @Get('class/:className')
  async findByClass(@Param('className') className: string, @Request() req): Promise<Student[]> {
    const { userId, role, classNames } = req.user;
    return this.studentsService.findByClass(className, userId, role, classNames);
  }

  @Get('class-id/:classId')
  async findByClassId(@Param('classId') classId: string, @Request() req): Promise<Student[]> {
    const { userId, role, classNames } = req.user;
    return this.studentsService.findByClassId(+classId, userId, role, classNames);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Student> {
    const { userId, role } = req.user;
    return this.studentsService.findOne(id, userId, role);
  }

  @Post()
  async create(@Body() createStudentDto: CreateStudentDto, @Request() req): Promise<Student> {
    const { userId } = req.user;
    return this.studentsService.create(createStudentDto, userId);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
    @Request() req
  ): Promise<Student> {
    const { userId, role } = req.user;
    return this.studentsService.update(id, updateStudentDto, userId, role);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Req() req: any) {
    const { userId, role } = req.user;
    return this.studentsService.remove(id, userId, role);
  }

  @Delete('batch/:ids')
  async batchRemove(@Param('ids') ids: string, @Req() req: any) {
    const { userId, role } = req.user;
    const idArray = ids.split(',');
    return this.studentsService.batchRemove(idArray, userId, role);
  }

  @Post('import')
  async importMany(
    @Body() students: CreateStudentDto[], 
    @Request() req,
    @Query('classId') classId?: string
  ): Promise<Student[]> {
    const { userId } = req.user;
    return this.studentsService.importMany(students, userId, classId ? parseInt(classId) : undefined);
  }

  // 新增：批量关联学生到班级
  @Patch('batch-associate-classes')
  async batchAssociateClasses(): Promise<{ message: string; updated: number }> {
    const result = await this.studentsService.batchAssociateToClasses();
    return {
      message: '批量关联完成',
      updated: result
    };
  }
}