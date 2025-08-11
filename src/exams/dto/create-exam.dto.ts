import { IsNotEmpty, IsString, IsNumber, IsOptional, IsDate, IsEnum } from 'class-validator';
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

export class CreateExamDto {
  @IsNotEmpty({ message: '考试名称不能为空' })
  @IsString({ message: '考试名称必须是字符串' })
  name: string;

  @IsNotEmpty({ message: '科目不能为空' })
  @IsString({ message: '科目必须是字符串' })
  subject: string;

  @IsNotEmpty({ message: '班级不能为空' })
  @IsString({ message: '班级必须是字符串' })
  className: string;

  @IsNotEmpty({ message: '考试日期不能为空' })
  @Type(() => Date)
  @IsDate({ message: '考试日期格式不正确' })
  examDate: Date;

  @IsNotEmpty({ message: '总分不能为空' })
  @IsNumber({}, { message: '总分必须是数字' })
  totalScore: number;

  @IsOptional()
  @IsEnum(ExamType, { message: '考试类型不正确' })
  examType?: string = ExamType.OTHER;

  @IsOptional()
  @IsEnum(ExamStatus, { message: '考试状态不正确' })
  status?: string = ExamStatus.NOT_STARTED;
}