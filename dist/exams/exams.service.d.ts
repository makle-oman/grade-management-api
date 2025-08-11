import { Repository } from 'typeorm';
import { Exam } from '../entities/exam.entity';
import { CreateExamDto } from './dto/create-exam.dto';
import { UpdateExamDto } from './dto/update-exam.dto';
export declare class ExamsService {
    private examsRepository;
    constructor(examsRepository: Repository<Exam>);
    findAll(): Promise<Exam[]>;
    findOne(id: string): Promise<Exam>;
    findByClass(className: string): Promise<Exam[]>;
    create(createExamDto: CreateExamDto): Promise<Exam>;
    update(id: string, updateExamDto: UpdateExamDto): Promise<Exam>;
    remove(id: string): Promise<void>;
}
