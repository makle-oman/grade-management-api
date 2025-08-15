import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';

export class CreateStudentDto {
  @IsNotEmpty({ message: '姓名不能为空' })
  @IsString({ message: '姓名必须是字符串' })
  name: string;

  @IsNotEmpty({ message: '学号不能为空' })
  @IsString({ message: '学号必须是字符串' })
  studentNumber: string;

  @IsOptional()
  @IsString({ message: '班级必须是字符串' })
  className?: string;

  @IsOptional()
  @IsNumber({}, { message: '班级ID必须是数字' })
  classId?: number;
}
