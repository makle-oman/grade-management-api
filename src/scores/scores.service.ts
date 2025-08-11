import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ExamsService } from '../exams/exams.service';
import { StudentsService } from '../students/students.service';

@Injectable()
export class ScoresService {
  constructor(
    @InjectRepository(Score)
    private scoresRepository: Repository<Score>,
    private examsService: ExamsService,
    private studentsService: StudentsService,
  ) {}

  async findAll(): Promise<Score[]> {
    return this.scoresRepository.find({
      order: { createdAt: 'DESC' },
      relations: ['student', 'exam'],
    });
  }

  async findOne(id: string): Promise<Score> {
    const score = await this.scoresRepository.findOne({ 
      where: { id },
      relations: ['student', 'exam'],
    });
    if (!score) {
      throw new NotFoundException(`成绩ID ${id} 不存在`);
    }
    return score;
  }

  async findByExam(examId: string): Promise<Score[]> {
    return this.scoresRepository.find({
      where: { examId },
      relations: ['student'],
      order: { score: 'DESC' },
    });
  }

  async findByStudent(studentId: string): Promise<Score[]> {
    return this.scoresRepository.find({
      where: { studentId },
      relations: ['exam'],
      order: { 
        exam: { examDate: 'DESC' } 
      } as any,
    });
  }

  async create(createScoreDto: CreateScoreDto): Promise<Score> {
    // 验证考试和学生是否存在
    await this.examsService.findOne(createScoreDto.examId);
    await this.studentsService.findOne(createScoreDto.studentId);

    // 检查是否已存在该学生的该考试成绩
    const existingScore = await this.scoresRepository.findOne({
      where: {
        examId: createScoreDto.examId,
        studentId: createScoreDto.studentId,
      },
    });

    if (existingScore) {
      throw new BadRequestException('该学生的该考试成绩已存在，请使用更新接口');
    }

    const score = this.scoresRepository.create(createScoreDto);
    return this.scoresRepository.save(score);
  }

  async update(id: string, updateScoreDto: UpdateScoreDto): Promise<Score> {
    const score = await this.findOne(id);
    const updatedScore = Object.assign(score, updateScoreDto);
    return this.scoresRepository.save(updatedScore);
  }

  async remove(id: string): Promise<void> {
    const result = await this.scoresRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`成绩ID ${id} 不存在`);
    }
  }

  async importScores(scores: CreateScoreDto[]): Promise<Score[]> {
    if (scores.length === 0) {
      return [];
    }

    const results: Score[] = [];
    
    // SQLite不支持returning子句，所以我们需要逐个处理
    for (const scoreDto of scores) {
      // 检查是否已存在该学生的该考试成绩
      const existingScore = await this.scoresRepository.findOne({
        where: {
          examId: scoreDto.examId,
          studentId: scoreDto.studentId,
        },
      });

      let score: Score;
      
      if (existingScore) {
        // 如果存在，则更新
        existingScore.score = scoreDto.score;
        existingScore.isAbsent = scoreDto.isAbsent;
        score = await this.scoresRepository.save(existingScore);
      } else {
        // 如果不存在，则创建新的
        const newScore = this.scoresRepository.create(scoreDto);
        score = await this.scoresRepository.save(newScore);
      }
      
      results.push(score);
    }

    return results;
  }

  async calculateRanks(examId: string): Promise<void> {
    // 获取该考试的所有成绩
    const scores = await this.scoresRepository.find({
      where: { examId, isAbsent: false },
      order: { score: 'DESC' },
    });

    // 计算排名
    let currentRank = 1;
    let previousScore = null;
    let sameRankCount = 0;

    for (let i = 0; i < scores.length; i++) {
      const score = scores[i];
      
      // 如果当前分数与前一个分数相同，则排名相同
      if (previousScore !== null && score.score === previousScore) {
        sameRankCount++;
      } else {
        currentRank += sameRankCount;
        sameRankCount = 0;
      }

      // 更新排名
      score.rank = currentRank;
      previousScore = score.score;
    }

    // 批量保存更新后的排名
    await this.scoresRepository.save(scores);
  }
}