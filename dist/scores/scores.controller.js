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
exports.ScoresController = void 0;
const common_1 = require("@nestjs/common");
const scores_service_1 = require("./scores.service");
const create_score_dto_1 = require("./dto/create-score.dto");
const update_score_dto_1 = require("./dto/update-score.dto");
const import_scores_dto_1 = require("./dto/import-scores.dto");
let ScoresController = class ScoresController {
    constructor(scoresService) {
        this.scoresService = scoresService;
    }
    async findAll() {
        return this.scoresService.findAll();
    }
    async findOne(id) {
        return this.scoresService.findOne(id);
    }
    async findByExam(examId) {
        return this.scoresService.findByExam(examId);
    }
    async findByStudent(studentId) {
        return this.scoresService.findByStudent(studentId);
    }
    async create(createScoreDto) {
        return this.scoresService.create(createScoreDto);
    }
    async update(id, updateScoreDto) {
        return this.scoresService.update(id, updateScoreDto);
    }
    async remove(id) {
        return this.scoresService.remove(id);
    }
    async importScores(importDto) {
        return this.scoresService.importScores(importDto.scores);
    }
    async calculateRanks(examId) {
        await this.scoresService.calculateRanks(examId);
        return { success: true, message: '排名计算完成' };
    }
};
exports.ScoresController = ScoresController;
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "findOne", null);
__decorate([
    (0, common_1.Get)('exam/:examId'),
    __param(0, (0, common_1.Param)('examId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "findByExam", null);
__decorate([
    (0, common_1.Get)('student/:studentId'),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "findByStudent", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_score_dto_1.CreateScoreDto]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_score_dto_1.UpdateScoreDto]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)('import'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [import_scores_dto_1.ImportScoresDto]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "importScores", null);
__decorate([
    (0, common_1.Post)('calculate-ranks/:examId'),
    __param(0, (0, common_1.Param)('examId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], ScoresController.prototype, "calculateRanks", null);
exports.ScoresController = ScoresController = __decorate([
    (0, common_1.Controller)('scores'),
    __metadata("design:paramtypes", [scores_service_1.ScoresService])
], ScoresController);
//# sourceMappingURL=scores.controller.js.map