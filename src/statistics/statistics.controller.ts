import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { StatisticsService } from './statistics.service';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('statistics')
@UseGuards(AuthGuard('jwt'))
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('exam/:examId')
  async getExamStatistics(
    @Param('examId') examId: string,
    @Query('excellentThreshold') excellentThreshold: string = '85',
    @Query('passThreshold') passThreshold: string = '60',
    @Query('poorThreshold') poorThreshold: string = '40',
    @Request() req
  ) {
    const { userId, role } = req.user;
    return this.statisticsService.getExamStatistics(
      examId,
      userId,
      role,
      parseInt(excellentThreshold),
      parseInt(passThreshold),
      parseInt(poorThreshold)
    );
  }

  @Get('semester/:semesterId')
  async getSemesterStatistics(
    @Param('semesterId') semesterId: string,
    @Query('className') className: string,
    @Request() req
  ) {
    const { userId, role, classNames } = req.user;
    return this.statisticsService.getSemesterStatistics(semesterId, userId, role, classNames, className);
  }

  @Get('class-comparison/:examId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GRADE_LEADER)
  async getClassComparison(
    @Param('examId') examId: string,
    @Request() req
  ) {
    const { userId, role } = req.user;
    return this.statisticsService.getClassComparison(examId, userId, role);
  }

  @Get('student/:studentId')
  async getStudentStatistics(
    @Param('studentId') studentId: string,
    @Query('semesterId') semesterId: string,
    @Request() req
  ) {
    const { userId, role } = req.user;
    return this.statisticsService.getStudentStatistics(studentId, semesterId, userId, role);
  }

  @Get('subject/:subject')
  async getSubjectStatistics(
    @Param('subject') subject: string,
    @Query('semesterId') semesterId: string,
    @Query('className') className: string,
    @Request() req
  ) {
    const { userId, role } = req.user;
    return this.statisticsService.getSubjectStatistics(subject, semesterId, className, userId, role);
  }
}