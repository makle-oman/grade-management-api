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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Exam = void 0;
const typeorm_1 = require("typeorm");
const score_entity_1 = require("./score.entity");
let Exam = class Exam {
};
exports.Exam = Exam;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], Exam.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Exam.prototype, "name", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Exam.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'class_name' }),
    __metadata("design:type", String)
], Exam.prototype, "className", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'date' }),
    __metadata("design:type", Date)
], Exam.prototype, "examDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'total_score' }),
    __metadata("design:type", Number)
], Exam.prototype, "totalScore", void 0);
__decorate([
    (0, typeorm_1.Column)({ name: 'exam_type', default: 'other' }),
    __metadata("design:type", String)
], Exam.prototype, "examType", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 'not_started' }),
    __metadata("design:type", String)
], Exam.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ name: 'created_at' }),
    __metadata("design:type", Date)
], Exam.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => score_entity_1.Score, score => score.exam),
    __metadata("design:type", Array)
], Exam.prototype, "scores", void 0);
exports.Exam = Exam = __decorate([
    (0, typeorm_1.Entity)('exams')
], Exam);
//# sourceMappingURL=exam.entity.js.map