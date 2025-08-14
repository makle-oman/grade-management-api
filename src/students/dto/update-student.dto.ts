import { IsOptional, IsString, IsNumber } from 'class-validator';

export class UpdateStudentDto {
  @IsOptional()
  @IsString({ message: '姓名必须是字符串' })
  name?: string;

  @IsOptional()
  @IsString({ message: '学号必须是字符串' })
  studentNumber?: string;

  @IsOptional()
  @IsString({ message: '班级必须是字符串' })
  className?: string;

  @IsOptional()
  @IsNumber({}, { message: '班级ID必须是数字' })
  classId?: number;

  @IsOptional()
  @IsString({ message: '教师ID必须是字符串' })
  teacherId?: string;
}
