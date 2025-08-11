import { ScoresService } from './scores.service';
import { Score } from '../entities/score.entity';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ImportScoresDto } from './dto/import-scores.dto';
export declare class ScoresController {
    private readonly scoresService;
    constructor(scoresService: ScoresService);
    findAll(): Promise<Score[]>;
    findOne(id: string): Promise<Score>;
    findByExam(examId: string): Promise<Score[]>;
    findByStudent(studentId: string): Promise<Score[]>;
    create(createScoreDto: CreateScoreDto): Promise<Score>;
    update(id: string, updateScoreDto: UpdateScoreDto): Promise<Score>;
    remove(id: string): Promise<void>;
    importScores(importDto: ImportScoresDto): Promise<Score[]>;
    calculateRanks(examId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
