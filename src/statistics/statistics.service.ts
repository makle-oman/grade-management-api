import { Injectable, NotFoundException, ForbiddenException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Score } from '../entities/score.entity';
import { Exam } from '../entities/exam.entity';
import { Student } from '../entities/student.entity';
import { UserRole } from '../entities/user.entity';

export interface ExamStatistics {
  examId: string;
  examName: string;
  totalStudents: number;
  submittedCount: number;
  absentCount: number;
  averageScore: number;
  maxScore: number;
  minScore: number;
  passCount: number;
  passRate: number;
  excellentCount: number;
  excellentRate: number;
  poorCount: number;
  poorRate: number;
  scoreDistribution: {
    range: string;
    count: number;
    percentage: number;
  }[];
}

export interface SemesterStatistics {
  semesterId: string;
  semesterName: string;
  totalExams: number;
  averageScore: number;
  studentProgress: {
    studentId: string;
    studentName: string;
    studentNumber: string;
    scores: number[];
    trend: 'up' | 'down' | 'stable';
    averageScore: number;
  }[];
  exams?: any[];
}

@Injectable()
export class StatisticsService {
  private readonly logger = new Logger(StatisticsService.name);

  constructor(
    @InjectRepository(Score)
    private scoreRepository: Repository<Score>,
    @InjectRepository(Exam)
    private examRepository: Repository<Exam>,
    @InjectRepository(Student)
    private studentRepository: Repository<Student>,
  ) {}

  async getExamStatistics(
    examId: string,
    userId?: string,
    userRole?: UserRole,
    excellentThreshold: number = 85,
    passThreshold: number = 60,
    poorThreshold: number = 40
  ): Promise<ExamStatistics> {
    try {
      this.logger.log(`获取考试统计: examId=${examId}, userId=${userId}, userRole=${userRole}`);
      
      // 检查考试权限
      const exam = await this.examRepository.findOne({
        where: { id: examId },
        relations: ['teacher']
      });

      if (!exam) {
        this.logger.warn(`考试不存在: examId=${examId}`);
        throw new NotFoundException('考试不存在');
      }

      // 管理员和年级组长可以查看所有考试统计，普通教师只能查看自己的考试
      if (userRole === UserRole.TEACHER && exam.teacherId !== userId) {
        this.logger.warn(`权限不足: userId=${userId}, examTeacherId=${exam.teacherId}`);
        throw new ForbiddenException('您没有权限查看此考试统计');
      }

      // 获取考试成绩
      const scores = await this.scoreRepository.find({
        where: { examId },
        relations: ['student']
      });

      this.logger.log(`找到 ${scores.length} 条成绩记录`);

      const validScores = scores.filter(score => !score.isAbsent && score.score !== null);
      const scoreValues = validScores.map(score => score.score);

      // 基础统计
      const totalStudents = scores.length;
      const submittedCount = validScores.length;
      const absentCount = scores.filter(score => score.isAbsent).length;
      
      const averageScore = scoreValues.length > 0 
        ? Math.round((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) * 100) / 100
        : 0;
      
      const maxScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
      const minScore = scoreValues.length > 0 ? Math.min(...scoreValues) : 0;

      // 等级统计
      const excellentCount = scoreValues.filter(score => score >= excellentThreshold).length;
      const passCount = scoreValues.filter(score => score >= passThreshold).length;
      const poorCount = scoreValues.filter(score => score < poorThreshold).length;

      const excellentRate = submittedCount > 0 
        ? Math.round((excellentCount / submittedCount) * 10000) / 100 
        : 0;
      const passRate = submittedCount > 0 
        ? Math.round((passCount / submittedCount) * 10000) / 100 
        : 0;
      const poorRate = submittedCount > 0 
        ? Math.round((poorCount / submittedCount) * 10000) / 100 
        : 0;

      // 分数段分布
      const scoreRanges = [
        { range: '90-100', min: 90, max: 100 },
        { range: '80-89', min: 80, max: 89 },
        { range: '70-79', min: 70, max: 79 },
        { range: '60-69', min: 60, max: 69 },
        { range: '50-59', min: 50, max: 59 },
        { range: '0-49', min: 0, max: 49 }
      ];

      const scoreDistribution = scoreRanges.map(range => {
        const count = scoreValues.filter(score => score >= range.min && score <= range.max).length;
        const percentage = submittedCount > 0 
          ? Math.round((count / submittedCount) * 10000) / 100 
          : 0;
        return {
          range: range.range,
          count,
          percentage
        };
      });

      const result = {
        examId,
        examName: exam.name,
        totalStudents,
        submittedCount,
        absentCount,
        averageScore,
        maxScore,
        minScore,
        passCount,
        passRate,
        excellentCount,
        excellentRate,
        poorCount,
        poorRate,
        scoreDistribution
      };

      this.logger.log(`考试统计完成: 平均分=${averageScore}, 及格率=${passRate}%`);
      return result;
    } catch (error) {
      this.logger.error(`获取考试统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSemesterStatistics(
    semesterId: string,
    userId?: string,
    userRole?: UserRole,
    userClassNames?: string[],
    filterClassName?: string
  ): Promise<SemesterStatistics> {
    try {
      this.logger.log(`获取学期统计: semesterId=${semesterId}, userId=${userId}, userRole=${userRole}, filterClassName=${filterClassName}`);
      
      // 获取学期内的考试
      let examQuery = this.examRepository.createQueryBuilder('exam')
        .leftJoinAndSelect('exam.semester', 'semester')
        .where('exam.semesterId = :semesterId', { semesterId })
        .orderBy('exam.examDate', 'ASC');

      // 如果指定了班级，只查询该班级的考试
      if (filterClassName) {
        examQuery = examQuery.andWhere('exam.className = :filterClassName', { filterClassName });
      }

      if (userRole === UserRole.TEACHER && userClassNames?.length > 0) {
        // 教师可以看到自己负责的班级的考试或自己创建的考试
        examQuery = examQuery.andWhere(
          '(exam.teacherId = :userId OR exam.className IN (:...classNames))',
          { userId, classNames: userClassNames }
        );
      } else if (userRole === UserRole.TEACHER) {
        examQuery = examQuery.andWhere('exam.teacherId = :userId', { userId });
      }

      const exams = await examQuery.getMany();

      if (exams.length === 0) {
        this.logger.warn(`该学期没有找到相关考试: semesterId=${semesterId}, filterClassName=${filterClassName}`);
        throw new NotFoundException('该学期没有找到相关考试');
      }

      this.logger.log(`找到 ${exams.length} 个考试`);

      const examIds = exams.map(exam => exam.id);
      
      // 获取所有成绩
      const scores = await this.scoreRepository
        .createQueryBuilder('score')
        .leftJoinAndSelect('score.student', 'student')
        .leftJoinAndSelect('score.exam', 'exam')
        .where('score.examId IN (:...examIds)', { examIds })
        .orderBy('exam.examDate', 'ASC')
        .getMany();

      // 计算学期平均分
      const validScores = scores.filter(score => !score.isAbsent && score.score !== null);
      const averageScore = validScores.length > 0
        ? Math.round((validScores.reduce((sum, score) => sum + score.score, 0) / validScores.length) * 100) / 100
        : 0;

      // 计算学生进步情况
      const studentScoreMap = new Map<string, { student: any, scores: number[], examDates: Date[] }>();
      
      validScores.forEach(score => {
        const studentId = score.studentId;
        if (!studentScoreMap.has(studentId)) {
          studentScoreMap.set(studentId, {
            student: score.student,
            scores: [],
            examDates: []
          });
        }
        studentScoreMap.get(studentId).scores.push(score.score);
        studentScoreMap.get(studentId).examDates.push(score.exam.examDate);
      });

      const studentProgress = Array.from(studentScoreMap.entries()).map(([studentId, data]) => {
        const { student, scores } = data;
        const studentAverageScore = Math.round((scores.reduce((sum, score) => sum + score, 0) / scores.length) * 100) / 100;
        
        // 计算趋势（简单的线性趋势）
        let trend: 'up' | 'down' | 'stable' = 'stable';
        if (scores.length >= 2) {
          const firstHalf = scores.slice(0, Math.ceil(scores.length / 2));
          const secondHalf = scores.slice(Math.floor(scores.length / 2));
          
          const firstAvg = firstHalf.reduce((sum, score) => sum + score, 0) / firstHalf.length;
          const secondAvg = secondHalf.reduce((sum, score) => sum + score, 0) / secondHalf.length;
          
          if (secondAvg > firstAvg + 2) {
            trend = 'up';
          } else if (secondAvg < firstAvg - 2) {
            trend = 'down';
          }
        }

        return {
          studentId,
          studentName: student.name,
          studentNumber: student.studentNumber,
          scores,
          trend,
          averageScore: studentAverageScore
        };
      });

      // 计算每个考试的平均分
      const examsWithAverage = await Promise.all(
        exams.map(async (exam) => {
          const examScores = scores.filter(score => score.examId === exam.id && !score.isAbsent && score.score !== null);
          const examAverageScore = examScores.length > 0
            ? Math.round((examScores.reduce((sum, score) => sum + score.score, 0) / examScores.length) * 100) / 100
            : 0;
          
          return {
            ...exam,
            averageScore: examAverageScore
          };
        })
      );

      const result = {
        semesterId,
        semesterName: exams[0].semester?.name || '未知学期',
        totalExams: exams.length,
        averageScore,
        studentProgress: studentProgress.sort((a, b) => b.averageScore - a.averageScore),
        exams: examsWithAverage
      };

      this.logger.log(`学期统计完成: 考试数=${exams.length}, 学生数=${studentProgress.length}, 平均分=${averageScore}`);
      return result;
    } catch (error) {
      this.logger.error(`获取学期统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getClassComparison(
    examId: string,
    userId?: string,
    userRole?: UserRole
  ) {
    try {
      this.logger.log(`获取班级对比: examId=${examId}, userId=${userId}, userRole=${userRole}`);
      
      const exam = await this.examRepository.findOne({
        where: { id: examId },
        relations: ['teacher']
      });

      if (!exam) {
        this.logger.warn(`考试不存在: examId=${examId}`);
        throw new NotFoundException('考试不存在');
      }

      // 管理员和年级组长可以查看所有考试的班级对比，普通教师只能查看自己的考试
      if (userRole === UserRole.TEACHER && exam.teacherId !== userId) {
        this.logger.warn(`权限不足: userId=${userId}, examTeacherId=${exam.teacherId}`);
        throw new ForbiddenException('您没有权限查看此考试统计');
      }

      // 获取同科目同日期的其他考试进行对比
      const compareExams = await this.examRepository.find({
        where: {
          subject: exam.subject,
          examDate: exam.examDate
        },
        relations: ['teacher']
      });

      this.logger.log(`找到 ${compareExams.length} 个同科目同日期的考试进行对比`);

      const classStats = [];
      
      for (const compareExam of compareExams) {
        try {
          const stats = await this.getExamStatistics(compareExam.id, userId, userRole);
          classStats.push({
            className: compareExam.className,
            teacherName: compareExam.teacher?.name || '未知教师',
            ...stats
          });
        } catch (error) {
          this.logger.warn(`获取考试 ${compareExam.id} 统计失败: ${error.message}`);
          // 继续处理其他考试，不中断整个流程
        }
      }

      const result = {
        examInfo: {
          name: exam.name,
          subject: exam.subject,
          examDate: exam.examDate
        },
        classComparison: classStats.sort((a, b) => b.averageScore - a.averageScore)
      };

      this.logger.log(`班级对比完成: 共对比 ${classStats.length} 个班级`);
      return result;
    } catch (error) {
      this.logger.error(`获取班级对比失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getStudentStatistics(
    studentId: string,
    semesterId?: string,
    userId?: string,
    userRole?: UserRole
  ) {
    try {
      this.logger.log(`获取学生统计: studentId=${studentId}, semesterId=${semesterId}`);
      
      const student = await this.studentRepository.findOne({
        where: { id: studentId }
      });

      if (!student) {
        throw new NotFoundException('学生不存在');
      }

      // 构建查询条件
      let scoreQuery = this.scoreRepository.createQueryBuilder('score')
        .leftJoinAndSelect('score.exam', 'exam')
        .leftJoinAndSelect('exam.semester', 'semester')
        .where('score.studentId = :studentId', { studentId })
        .orderBy('exam.examDate', 'ASC');

      if (semesterId) {
        scoreQuery = scoreQuery.andWhere('exam.semesterId = :semesterId', { semesterId });
      }

      const scores = await scoreQuery.getMany();
      const validScores = scores.filter(score => !score.isAbsent && score.score !== null);

      if (validScores.length === 0) {
        return {
          studentId,
          studentName: student.name,
          studentNumber: student.studentNumber,
          totalExams: scores.length,
          validExams: 0,
          averageScore: 0,
          maxScore: 0,
          minScore: 0,
          trend: 'stable' as const,
          scores: []
        };
      }

      const scoreValues = validScores.map(score => score.score);
      const averageScore = Math.round((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) * 100) / 100;
      const maxScore = Math.max(...scoreValues);
      const minScore = Math.min(...scoreValues);

      // 计算趋势
      let trend: 'up' | 'down' | 'stable' = 'stable';
      if (scoreValues.length >= 3) {
        const firstThird = scoreValues.slice(0, Math.floor(scoreValues.length / 3));
        const lastThird = scoreValues.slice(-Math.floor(scoreValues.length / 3));
        
        const firstAvg = firstThird.reduce((sum, score) => sum + score, 0) / firstThird.length;
        const lastAvg = lastThird.reduce((sum, score) => sum + score, 0) / lastThird.length;
        
        if (lastAvg > firstAvg + 3) {
          trend = 'up';
        } else if (lastAvg < firstAvg - 3) {
          trend = 'down';
        }
      }

      return {
        studentId,
        studentName: student.name,
        studentNumber: student.studentNumber,
        totalExams: scores.length,
        validExams: validScores.length,
        averageScore,
        maxScore,
        minScore,
        trend,
        scores: validScores.map(score => ({
          examId: score.exam.id,
          examName: score.exam.name,
          subject: score.exam.subject,
          examDate: score.exam.examDate,
          score: score.score
        }))
      };
    } catch (error) {
      this.logger.error(`获取学生统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getSubjectStatistics(
    subject: string,
    semesterId?: string,
    className?: string,
    userId?: string,
    userRole?: UserRole
  ) {
    try {
      this.logger.log(`获取科目统计: subject=${subject}, semesterId=${semesterId}, className=${className}`);
      
      let examQuery = this.examRepository.createQueryBuilder('exam')
        .where('exam.subject = :subject', { subject });

      if (semesterId) {
        examQuery = examQuery.andWhere('exam.semesterId = :semesterId', { semesterId });
      }

      if (className) {
        examQuery = examQuery.andWhere('exam.className = :className', { className });
      }

      // 权限控制
      if (userRole === UserRole.TEACHER) {
        examQuery = examQuery.andWhere('exam.teacherId = :userId', { userId });
      }

      const exams = await examQuery.getMany();

      if (exams.length === 0) {
        throw new NotFoundException('未找到相关考试');
      }

      const examIds = exams.map(exam => exam.id);
      const scores = await this.scoreRepository.find({
        where: { examId: In(examIds) },
        relations: ['student', 'exam']
      });

      const validScores = scores.filter(score => !score.isAbsent && score.score !== null);
      const scoreValues = validScores.map(score => score.score);

      const averageScore = scoreValues.length > 0
        ? Math.round((scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length) * 100) / 100
        : 0;

      const maxScore = scoreValues.length > 0 ? Math.max(...scoreValues) : 0;
      const minScore = scoreValues.length > 0 ? Math.min(...scoreValues) : 0;

      // 按考试分组统计
      const examStats = exams.map(exam => {
        const examScores = scores.filter(score => score.examId === exam.id && !score.isAbsent && score.score !== null);
        const examScoreValues = examScores.map(score => score.score);
        
        return {
          examId: exam.id,
          examName: exam.name,
          examDate: exam.examDate,
          className: exam.className,
          totalStudents: scores.filter(score => score.examId === exam.id).length,
          validStudents: examScores.length,
          averageScore: examScoreValues.length > 0
            ? Math.round((examScoreValues.reduce((sum, score) => sum + score, 0) / examScoreValues.length) * 100) / 100
            : 0,
          maxScore: examScoreValues.length > 0 ? Math.max(...examScoreValues) : 0,
          minScore: examScoreValues.length > 0 ? Math.min(...examScoreValues) : 0
        };
      });

      return {
        subject,
        semesterId,
        className,
        totalExams: exams.length,
        totalStudents: scores.length,
        validStudents: validScores.length,
        averageScore,
        maxScore,
        minScore,
        examStats: examStats.sort((a, b) => new Date(a.examDate).getTime() - new Date(b.examDate).getTime())
      };
    } catch (error) {
      this.logger.error(`获取科目统计失败: ${error.message}`, error.stack);
      throw error;
    }
  }
}