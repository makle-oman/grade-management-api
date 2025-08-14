import { Repository } from 'typeorm';
import { Score } from '../entities/score.entity';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ExamsService } from '../exams/exams.service';
import { StudentsService } from '../students/students.service';
export declare class ScoresService {
    private scoresRepository;
    private examsService;
    private studentsService;
    constructor(scoresRepository: Repository<Score>, examsService: ExamsService, studentsService: StudentsService);
    findAll(userId?: string, userRole?: string): Promise<Score[]>;
    findOne(id: string, userId?: string, userRole?: string): Promise<Score>;
    findByExam(examId: string, userId?: string, userRole?: string): Promise<Score[]>;
    findByStudent(studentId: string, userId?: string, userRole?: string): Promise<Score[]>;
    create(createScoreDto: CreateScoreDto): Promise<Score>;
    update(id: string, updateScoreDto: UpdateScoreDto, userId?: string): Promise<Score>;
    remove(id: string, userId?: string): Promise<void>;
    importScores(scores: CreateScoreDto[]): Promise<Score[]>;
    calculateRanks(examId: string, userId?: string): Promise<void>;
}
