import { IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateScoreDto {
  @IsOptional()
  @IsNumber({}, { message: '成绩必须是数字' })
  score?: number;

  @IsOptional()
  @IsBoolean({ message: '缺考标记必须是布尔值' })
  isAbsent?: boolean;
}