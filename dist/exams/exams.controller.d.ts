import { ExamsService } from './exams.service';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
export declare class ExamsController {
    private readonly examsService;
    constructor(examsService: ExamsService);
    findAll(req: any): Promise<Exam[]>;
    findByTeacher(teacherId: string): Promise<Exam[]>;
    findBySemester(semesterId: string, req: any): Promise<Exam[]>;
    findByClass(className: string, req: any): Promise<Exam[]>;
    findOne(id: string, req: any): Promise<Exam>;
    getStatistics(id: string, req: any): Promise<{
        exam: Exam;
    }>;
    create(createExamDto: CreateExamDto, req: any): Promise<Exam>;
    update(id: string, updateExamDto: UpdateExamDto, req: any): Promise<Exam>;
    remove(id: string, req: any): Promise<void>;
}
