import { IsNotEmpty, IsString, IsNumber, IsOptional, IsBoolean, ValidateNested, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

class ScoreImportItem {
  @IsNotEmpty({ message: '学生ID不能为空' })
  @IsString({ message: '学生ID必须是字符串' })
  studentId: string;

  @IsNotEmpty({ message: '考试ID不能为空' })
  @IsString({ message: '考试ID必须是字符串' })
  examId: string;

  @IsOptional()
  @IsNumber({}, { message: '成绩必须是数字' })
  score?: number;

  @IsOptional()
  @IsBoolean({ message: '缺考标记必须是布尔值' })
  isAbsent?: boolean = false;
}

export class ImportScoresDto {
  @ValidateNested({ each: true })
  @Type(() => ScoreImportItem)
  @ArrayMinSize(1, { message: '至少需要一条成绩记录' })
  scores: ScoreImportItem[];
}