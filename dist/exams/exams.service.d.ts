import { Repository } from 'typeorm';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
import { UserRole } from '../entities/user.entity';
export declare class ExamsService {
    private examsRepository;
    constructor(examsRepository: Repository<Exam>);
    findAll(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Exam[]>;
    findOne(id: string, userId?: string, userRole?: UserRole): Promise<Exam>;
    findByClass(className: string, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Exam[]>;
    findByTeacher(teacherId: string): Promise<Exam[]>;
    findBySemester(semesterId: string, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Exam[]>;
    create(createExamDto: CreateExamDto, teacherId?: string): Promise<Exam>;
    update(id: string, updateExamDto: UpdateExamDto, userId?: string, userRole?: UserRole): Promise<Exam>;
    remove(id: string, userId?: string, userRole?: UserRole): Promise<void>;
    getExamStatistics(examId: string, userId?: string, userRole?: UserRole): Promise<{
        exam: Exam;
    }>;
}
