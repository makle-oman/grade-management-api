import { IsOptional, IsString, IsNumber, IsDate, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';

enum ExamStatus {
  NOT_STARTED = 'not_started',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  ANALYZED = 'analyzed',
}

enum ExamType {
  MIDTERM = 'midterm',
  FINAL = 'final',
  QUIZ = 'quiz',
  OTHER = 'other',
}

export class UpdateExamDto {
  @IsOptional()
  @IsString({ message: '考试名称必须是字符串' })
  name?: string;

  @IsOptional()
  @IsString({ message: '科目必须是字符串' })
  subject?: string;

  @IsOptional()
  @IsString({ message: '班级必须是字符串' })
  className?: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate({ message: '考试日期格式不正确' })
  examDate?: Date;

  @IsOptional()
  @IsNumber({}, { message: '总分必须是数字' })
  totalScore?: number;

  @IsOptional()
  @IsEnum(ExamType, { message: '考试类型不正确' })
  examType?: string;

  @IsOptional()
  @IsEnum(ExamStatus, { message: '考试状态不正确' })
  status?: string;
}