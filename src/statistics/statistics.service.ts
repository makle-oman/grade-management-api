import { Injectable, NotFoundException, ForbiddenException, Logger, Inject } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
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
    @Inject(CACHE_MANAGER)
    private cacheManager: Cache,
  ) {}

  private getCacheKey(prefix: string, ...params: string[]): string {
    return `${prefix}:${params.join(':')}`;
  }

  private async getCachedData<T>(key: string, ttl: number = 300): Promise<T | null> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      this.logger.warn(`缓存获取失败: ${error.message}`);
      return null;
    }
  }

  private async setCachedData<T>(key: string, data: T, ttl: number = 300): Promise<void> {
    try {
      await this.cacheManager.set(key, data, ttl);
    } catch (error) {
      this.logger.warn(`缓存设置失败: ${error.message}`);
    }
  }

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

  async getGradeAnalysis(
    semesterId: string,
    gradeLevel: string,
    userId?: string,
    userRole?: UserRole
  ) {
    try {
      this.logger.log(`获取年级分析: semesterId=${semesterId}, gradeLevel=${gradeLevel}, userId=${userId}, userRole=${userRole}`);
      
      // 只有管理员和年级组长可以查看年级分析
      if (userRole !== UserRole.ADMIN && userRole !== UserRole.GRADE_LEADER) {
        this.logger.warn(`权限不足: userId=${userId}, userRole=${userRole}`);
        throw new ForbiddenException('您没有权限查看年级分析');
      }
      
      // 将数字年级转换为中文年级名称
      let gradeName: string;
      switch (gradeLevel) {
        case '1': gradeName = '一年级'; break;
        case '2': gradeName = '二年级'; break;
        case '3': gradeName = '三年级'; break;
        case '4': gradeName = '四年级'; break;
        case '5': gradeName = '五年级'; break;
        case '6': gradeName = '六年级'; break;
        default: gradeName = `${gradeLevel}年级`;
      }
      
      this.logger.log(`查找年级: ${gradeName}`);
      
      // 直接获取该学期的所有考试
      const allExams = await this.examRepository.createQueryBuilder('exam')
        .leftJoinAndSelect('exam.semester', 'semester')
        .leftJoinAndSelect('exam.teacher', 'teacher')
        .where('exam.semesterId = :semesterId', { semesterId })
        .getMany();
      
      this.logger.log(`找到 ${allExams.length} 个考试记录`);
      
      if (allExams.length === 0) {
        this.logger.warn(`未找到相关考试: semesterId=${semesterId}`);
        throw new NotFoundException(`未找到当前学期的考试数据`);
      }
      
      // 过滤出指定年级的考试
      // 班级名称可能是多种格式：1班、一班、1-1班、一年级1班等
      const exams = allExams.filter(exam => {
        const className = exam.className || '';
        
        // 检查班级名称是否包含年级信息
        if (gradeLevel === '1') {
          return className.includes('1年级') || 
                 className.includes('一年级') || 
                 className.startsWith('1班') || 
                 className.startsWith('1-') || 
                 className.startsWith('一班') ||
                 className === '1' ||
                 className === '一' ||
                 className.includes('一(') ||
                 className.includes('一（');
        } else if (gradeLevel === '2') {
          return className.includes('2年级') || 
                 className.includes('二年级') || 
                 className.startsWith('2班') || 
                 className.startsWith('2-') || 
                 className.startsWith('二班') ||
                 className === '2' ||
                 className === '二' ||
                 className.includes('二(') ||
                 className.includes('二（');
        } else if (gradeLevel === '3') {
          return className.includes('3年级') || 
                 className.includes('三年级') || 
                 className.startsWith('3班') || 
                 className.startsWith('3-') || 
                 className.startsWith('三班') ||
                 className === '3' ||
                 className === '三' ||
                 className.includes('三(') ||
                 className.includes('三（');
        } else if (gradeLevel === '4') {
          return className.includes('4年级') || 
                 className.includes('四年级') || 
                 className.startsWith('4班') || 
                 className.startsWith('4-') || 
                 className.startsWith('四班') ||
                 className === '4' ||
                 className === '四' ||
                 className.includes('四(') ||
                 className.includes('四（');
        } else if (gradeLevel === '5') {
          return className.includes('5年级') || 
                 className.includes('五年级') || 
                 className.startsWith('5班') || 
                 className.startsWith('5-') || 
                 className.startsWith('五班') ||
                 className === '5' ||
                 className === '五' ||
                 className.includes('五(') ||
                 className.includes('五（');
        } else if (gradeLevel === '6') {
          return className.includes('6年级') || 
                 className.includes('六年级') || 
                 className.startsWith('6班') || 
                 className.startsWith('6-') || 
                 className.startsWith('六班') ||
                 className === '6' ||
                 className === '六' ||
                 className.includes('六(') ||
                 className.includes('六（');
        }
        return false;
      });
      
      this.logger.log(`过滤后找到 ${exams.length} 个${gradeName}的考试记录`);
      
      if (exams.length === 0) {
        this.logger.warn(`未找到相关考试: semesterId=${semesterId}, gradeLevel=${gradeLevel}`);
        throw new NotFoundException(`未找到${gradeName}在当前学期的考试数据`);
      }
      
      // 获取所有班级名称（从考试记录中提取）
      const classNames = [...new Set(exams.map(exam => exam.className))];
      this.logger.log(`考试中的班级: ${classNames.join(', ')}`);
      
      // 获取所有考试的成绩
      const examIds = exams.map(exam => exam.id);
      const scores = await this.scoreRepository.find({
        where: { examId: In(examIds) },
        relations: ['student', 'exam']
      });
      
      // 计算年级总体统计
      const validScores = scores.filter(score => !score.isAbsent && score.score !== null);
      const totalStudents = [...new Set(scores.map(score => score.studentId))].length;
      const gradeAverage = validScores.length > 0
        ? Math.round((validScores.reduce((sum, score) => sum + score.score, 0) / validScores.length) * 100) / 100
        : 0;
      
      // 计算优秀率（85分以上）
      const excellentCount = validScores.filter(score => score.score >= 85).length;
      const excellentRate = validScores.length > 0
        ? Math.round((excellentCount / validScores.length) * 10000) / 100
        : 0;
      
      // 按班级分组统计
      const classComparison = [];
      
      for (const className of classNames) {
        // 获取该班级的所有考试
        const classExams = exams.filter(exam => exam.className === className);
        
        if (classExams.length === 0) continue;
        
        // 获取该班级的所有成绩
        const classExamIds = classExams.map(exam => exam.id);
        const classScores = scores.filter(score => classExamIds.includes(score.examId));
        const validClassScores = classScores.filter(score => !score.isAbsent && score.score !== null);
        
        // 计算班级平均分
        const classAverage = validClassScores.length > 0
          ? Math.round((validClassScores.reduce((sum, score) => sum + score.score, 0) / validClassScores.length) * 100) / 100
          : 0;
        
        // 计算班级优秀率和及格率
        const classExcellentCount = validClassScores.filter(score => score.score >= 85).length;
        const classPassCount = validClassScores.filter(score => score.score >= 60).length;
        
        const classExcellentRate = validClassScores.length > 0
          ? Math.round((classExcellentCount / validClassScores.length) * 10000) / 100
          : 0;
        
        const classPassRate = validClassScores.length > 0
          ? Math.round((classPassCount / validClassScores.length) * 10000) / 100
          : 0;
        
        // 计算进步情况（与上次考试相比）
        // 这里简化处理，实际应该比较同一科目的前后考试
        let improvement = 0;
        
        // 获取班主任信息
        const teacher = classExams[0]?.teacher?.name || '-';
        
        // 获取学生数量
        const studentCount = [...new Set(classScores.map(score => score.studentId))].length;
        
        classComparison.push({
          className,
          teacher,
          studentCount,
          averageScore: classAverage,
          excellentRate: classExcellentRate,
          passRate: classPassRate,
          improvement
        });
      }

      return {
        gradeName,
        totalClasses: classNames.length,
        totalStudents,
        gradeAverage,
        excellentRate,
        classComparison: classComparison.sort((a, b) => b.averageScore - a.averageScore)
      };
    } catch (error) {
      this.logger.error(`获取年级分析失败: ${error.message}`, error.stack);
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