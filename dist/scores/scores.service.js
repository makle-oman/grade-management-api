"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ScoresService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const score_entity_1 = require("../entities/score.entity");
const exams_service_1 = require("../exams/exams.service");
const students_service_1 = require("../students/students.service");
let ScoresService = class ScoresService {
    constructor(scoresRepository, examsService, studentsService) {
        this.scoresRepository = scoresRepository;
        this.examsService = examsService;
        this.studentsService = studentsService;
    }
    async findAll() {
        return this.scoresRepository.find({
            order: { createdAt: 'DESC' },
            relations: ['student', 'exam'],
        });
    }
    async findOne(id) {
        const score = await this.scoresRepository.findOne({
            where: { id },
            relations: ['student', 'exam'],
        });
        if (!score) {
            throw new common_1.NotFoundException(`成绩ID ${id} 不存在`);
        }
        return score;
    }
    async findByExam(examId) {
        return this.scoresRepository.find({
            where: { examId },
            relations: ['student'],
            order: { score: 'DESC' },
        });
    }
    async findByStudent(studentId) {
        return this.scoresRepository.find({
            where: { studentId },
            relations: ['exam'],
            order: {
                exam: { examDate: 'DESC' }
            },
        });
    }
    async create(createScoreDto) {
        await this.examsService.findOne(createScoreDto.examId);
        await this.studentsService.findOne(createScoreDto.studentId);
        const existingScore = await this.scoresRepository.findOne({
            where: {
                examId: createScoreDto.examId,
                studentId: createScoreDto.studentId,
            },
        });
        if (existingScore) {
            throw new common_1.BadRequestException('该学生的该考试成绩已存在，请使用更新接口');
        }
        const score = this.scoresRepository.create(createScoreDto);
        return this.scoresRepository.save(score);
    }
    async update(id, updateScoreDto) {
        const score = await this.findOne(id);
        const updatedScore = Object.assign(score, updateScoreDto);
        return this.scoresRepository.save(updatedScore);
    }
    async remove(id) {
        const result = await this.scoresRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`成绩ID ${id} 不存在`);
        }
    }
    async importScores(scores) {
        if (scores.length === 0) {
            return [];
        }
        const results = [];
        for (const scoreDto of scores) {
            const existingScore = await this.scoresRepository.findOne({
                where: {
                    examId: scoreDto.examId,
                    studentId: scoreDto.studentId,
                },
            });
            let score;
            if (existingScore) {
                existingScore.score = scoreDto.score;
                existingScore.isAbsent = scoreDto.isAbsent;
                score = await this.scoresRepository.save(existingScore);
            }
            else {
                const newScore = this.scoresRepository.create(scoreDto);
                score = await this.scoresRepository.save(newScore);
            }
            results.push(score);
        }
        return results;
    }
    async calculateRanks(examId) {
        const scores = await this.scoresRepository.find({
            where: { examId, isAbsent: false },
            order: { score: 'DESC' },
        });
        let currentRank = 1;
        let previousScore = null;
        let sameRankCount = 0;
        for (let i = 0; i < scores.length; i++) {
            const score = scores[i];
            if (previousScore !== null && score.score === previousScore) {
                sameRankCount++;
            }
            else {
                currentRank += sameRankCount;
                sameRankCount = 0;
            }
            score.rank = currentRank;
            previousScore = score.score;
        }
        await this.scoresRepository.save(scores);
    }
};
exports.ScoresService = ScoresService;
exports.ScoresService = ScoresService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(score_entity_1.Score)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        exams_service_1.ExamsService,
        students_service_1.StudentsService])
], ScoresService);
//# sourceMappingURL=scores.service.js.map