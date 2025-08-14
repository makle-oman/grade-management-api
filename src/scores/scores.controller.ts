import { Controller, Get, Post, Body, Param, Put, Delete, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ScoresService } from './scores.service';
import { Score } from '../entities/score.entity';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ImportScoresDto } from './dto/import-scores.dto';

@Controller('scores')
@UseGuards(AuthGuard('jwt'))
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  async findAll(@Request() req): Promise<Score[]> {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;
    return this.scoresService.findAll(userId, userRole);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req): Promise<Score> {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;
    return this.scoresService.findOne(id, userId, userRole);
  }

  @Get('exam/:examId')
  async findByExam(@Param('examId') examId: string, @Request() req): Promise<Score[]> {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;
    return this.scoresService.findByExam(examId, userId, userRole);
  }

  @Get('student/:studentId')
  async findByStudent(@Param('studentId') studentId: string, @Request() req): Promise<Score[]> {
    const userId = req.user?.id || req.user?.userId;
    const userRole = req.user?.role;
    return this.scoresService.findByStudent(studentId, userId, userRole);
  }

  @Post()
  async create(@Body() createScoreDto: CreateScoreDto, @Request() req): Promise<Score> {
    const userId = req.user?.id || req.user?.userId;
    // 添加用户ID到成绩记录中
    return this.scoresService.create({
      ...createScoreDto,
      userId
    });
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateScoreDto: UpdateScoreDto,
    @Request() req
  ): Promise<Score> {
    const userId = req.user?.id || req.user?.userId;
    return this.scoresService.update(id, updateScoreDto, userId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req): Promise<void> {
    const userId = req.user?.id || req.user?.userId;
    return this.scoresService.remove(id, userId);
  }

  @Post('import')
  async importScores(@Body() importDto: ImportScoresDto, @Request() req): Promise<Score[]> {
    const userId = req.user?.id || req.user?.userId;
    // 添加用户ID到每个成绩记录中
    const scoresWithUserId = importDto.scores.map(score => ({
      ...score,
      userId
    }));
    return this.scoresService.importScores(scoresWithUserId);
  }

  @Post('calculate-ranks/:examId')
  async calculateRanks(@Param('examId') examId: string, @Request() req): Promise<{ success: boolean; message: string }> {
    const userId = req.user?.id || req.user?.userId;
    await this.scoresService.calculateRanks(examId, userId);
    return { success: true, message: '排名计算完成' };
  }
}