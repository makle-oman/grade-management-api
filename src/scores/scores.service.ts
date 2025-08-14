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

  async findAll(userId?: string, userRole?: string): Promise<Score[]> {
    // 如果没有提供userId，则返回空数组，确保数据安全
    if (!userId) {
      return [];
    }
    
    const query = this.scoresRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.student', 'student')
      .leftJoinAndSelect('score.exam', 'exam')
      .leftJoin('exam.teacher', 'teacher')
      .orderBy('score.createdAt', 'DESC');
    
    // 根据用户角色决定数据访问范围
    if (userRole === 'admin' || userRole === 'grade_leader') {
      // 管理员和年级组长可以看到所有成绩
      // 不添加额外的where条件
    } else {
      // 普通教师只能看到自己创建的成绩
      query.where('teacher.id = :userId', { userId });
    }
    
    return query.getMany();
  }

  async findOne(id: string, userId?: string, userRole?: string): Promise<Score> {
    const queryBuilder = this.scoresRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.student', 'student')
      .leftJoinAndSelect('score.exam', 'exam')
      .where('score.id = :id', { id });
    
    // 根据用户角色决定数据访问范围
    if (userRole !== 'admin' && userRole !== 'grade_leader' && userId) {
      // 普通教师只能访问自己创建的成绩
      queryBuilder.andWhere('score.userId = :userId', { userId });
    }
    
    const score = await queryBuilder.getOne();
    
    if (!score) {
      throw new NotFoundException(`成绩ID ${id} 不存在或您没有权限访问`);
    }
    return score;
  }

  async findByExam(examId: string, userId?: string, userRole?: string): Promise<Score[]> {
    const queryBuilder = this.scoresRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.student', 'student')
      .where('score.examId = :examId', { examId })
      .orderBy('score.score', 'DESC');
    
    // 根据用户角色决定数据访问范围
    if (userRole !== 'admin' && userRole !== 'grade_leader' && userId) {
      // 普通教师只能访问自己创建的成绩
      queryBuilder.andWhere('score.userId = :userId', { userId });
    }
    
    return queryBuilder.getMany();
  }

  async findByStudent(studentId: string, userId?: string, userRole?: string): Promise<Score[]> {
    const queryBuilder = this.scoresRepository
      .createQueryBuilder('score')
      .leftJoinAndSelect('score.exam', 'exam')
      .where('score.studentId = :studentId', { studentId })
      .orderBy('exam.examDate', 'DESC');
    
    // 根据用户角色决定数据访问范围
    if (userRole !== 'admin' && userRole !== 'grade_leader' && userId) {
      // 普通教师只能访问自己创建的成绩
      queryBuilder.andWhere('score.userId = :userId', { userId });
    }
    
    return queryBuilder.getMany();
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

    // 确保userId字段被设置
    if (!createScoreDto.userId) {
      throw new BadRequestException('缺少用户ID，无法创建成绩记录');
    }

    const score = this.scoresRepository.create(createScoreDto);
    return this.scoresRepository.save(score);
  }

  async update(id: string, updateScoreDto: UpdateScoreDto, userId?: string): Promise<Score> {
    const score = await this.findOne(id, userId);
    
    // 如果提供了userId，确保用户只能更新自己的记录
    if (userId && score.userId !== userId) {
      throw new NotFoundException(`成绩ID ${id} 不存在或您没有权限修改`);
    }
    
    const updatedScore = Object.assign(score, updateScoreDto);
    return this.scoresRepository.save(updatedScore);
  }

  async remove(id: string, userId?: string): Promise<void> {
    // 如果提供了userId，确保用户只能删除自己的记录
    if (userId) {
      const score = await this.findOne(id, userId);
      if (!score) {
        throw new NotFoundException(`成绩ID ${id} 不存在或您没有权限删除`);
      }
      await this.scoresRepository.remove(score);
      return;
    }
    
    // 如果没有提供userId，则使用普通删除（管理员操作）
    const result = await this.scoresRepository.delete(id);
    if (result.affected === 0) {
      throw new NotFoundException(`成绩ID ${id} 不存在`);
    }
  }

  async importScores(scores: CreateScoreDto[]): Promise<Score[]> {
    if (scores.length === 0) {
      return [];
    }

    // 确保所有记录都有userId
    const hasUserId = scores.every(score => !!score.userId);
    if (!hasUserId) {
      throw new BadRequestException('缺少用户ID，无法导入成绩记录');
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
        // 保留原始的userId，不覆盖
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

  async calculateRanks(examId: string, userId?: string): Promise<void> {
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