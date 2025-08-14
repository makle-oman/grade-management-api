import { ScoresService } from './scores.service';
import { Score } from '../entities/score.entity';
import { CreateScoreDto } from './dto/create-score.dto';
import { UpdateScoreDto } from './dto/update-score.dto';
import { ImportScoresDto } from './dto/import-scores.dto';
export declare class ScoresController {
    private readonly scoresService;
    constructor(scoresService: ScoresService);
    findAll(req: any): Promise<Score[]>;
    findOne(id: string, req: any): Promise<Score>;
    findByExam(examId: string, req: any): Promise<Score[]>;
    findByStudent(studentId: string, req: any): Promise<Score[]>;
    create(createScoreDto: CreateScoreDto, req: any): Promise<Score>;
    update(id: string, updateScoreDto: UpdateScoreDto, req: any): Promise<Score>;
    remove(id: string, req: any): Promise<void>;
    importScores(importDto: ImportScoresDto, req: any): Promise<Score[]>;
    calculateRanks(examId: string, req: any): Promise<{
        success: boolean;
        message: string;
    }>;
}
