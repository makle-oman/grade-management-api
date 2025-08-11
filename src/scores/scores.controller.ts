import { Controller, Get, Post, Body, Param, Put, Delete } from '@nestjs/common';
import { ScoresService } from './scores.service';
import { Score } from '../entities/score.entity';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ImportScoresDto } from './dto/import-scores.dto';

@Controller('scores')
export class ScoresController {
  constructor(private readonly scoresService: ScoresService) {}

  @Get()
  async findAll(): Promise<Score[]> {
    return this.scoresService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<Score> {
    return this.scoresService.findOne(id);
  }

  @Get('exam/:examId')
  async findByExam(@Param('examId') examId: string): Promise<Score[]> {
    return this.scoresService.findByExam(examId);
  }

  @Get('student/:studentId')
  async findByStudent(@Param('studentId') studentId: string): Promise<Score[]> {
    return this.scoresService.findByStudent(studentId);
  }

  @Post()
  async create(@Body() createScoreDto: CreateScoreDto): Promise<Score> {
    return this.scoresService.create(createScoreDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateScoreDto: UpdateScoreDto,
  ): Promise<Score> {
    return this.scoresService.update(id, updateScoreDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string): Promise<void> {
    return this.scoresService.remove(id);
  }

  @Post('import')
  async importScores(@Body() importDto: ImportScoresDto): Promise<Score[]> {
    return this.scoresService.importScores(importDto.scores);
  }

  @Post('calculate-ranks/:examId')
  async calculateRanks(@Param('examId') examId: string): Promise<{ success: boolean; message: string }> {
    await this.scoresService.calculateRanks(examId);
    return { success: true, message: '排名计算完成' };
  }
}