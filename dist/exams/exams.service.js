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
exports.ExamsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const exam_entity_1 = require("../entities/exam.entity");
let ExamsService = class ExamsService {
    constructor(examsRepository) {
        this.examsRepository = examsRepository;
    }
    async findAll() {
        return this.examsRepository.find({
            order: { createdAt: 'DESC' },
        });
    }
    async findOne(id) {
        const exam = await this.examsRepository.findOne({ where: { id } });
        if (!exam) {
            throw new common_1.NotFoundException(`考试ID ${id} 不存在`);
        }
        return exam;
    }
    async findByClass(className) {
        return this.examsRepository.find({
            where: { className },
            order: { examDate: 'DESC' },
        });
    }
    async create(createExamDto) {
        const exam = this.examsRepository.create(createExamDto);
        return this.examsRepository.save(exam);
    }
    async update(id, updateExamDto) {
        const exam = await this.findOne(id);
        const updatedExam = Object.assign(exam, updateExamDto);
        return this.examsRepository.save(updatedExam);
    }
    async remove(id) {
        const result = await this.examsRepository.delete(id);
        if (result.affected === 0) {
            throw new common_1.NotFoundException(`考试ID ${id} 不存在`);
        }
    }
};
exports.ExamsService = ExamsService;
exports.ExamsService = ExamsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(exam_entity_1.Exam)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ExamsService);
//# sourceMappingURL=exams.service.js.map