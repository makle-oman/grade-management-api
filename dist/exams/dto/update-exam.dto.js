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
exports.UpdateExamDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
var ExamStatus;
(function (ExamStatus) {
    ExamStatus["NOT_STARTED"] = "not_started";
    ExamStatus["IN_PROGRESS"] = "in_progress";
    ExamStatus["COMPLETED"] = "completed";
})(ExamStatus || (ExamStatus = {}));
var ExamType;
(function (ExamType) {
    ExamType["MIDTERM"] = "midterm";
    ExamType["FINAL"] = "final";
    ExamType["QUIZ"] = "quiz";
    ExamType["OTHER"] = "other";
})(ExamType || (ExamType = {}));
class UpdateExamDto {
}
exports.UpdateExamDto = UpdateExamDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '考试名称必须是字符串' }),
    __metadata("design:type", String)
], UpdateExamDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '科目必须是字符串' }),
    __metadata("design:type", String)
], UpdateExamDto.prototype, "subject", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)({ message: '班级必须是字符串' }),
    __metadata("design:type", String)
], UpdateExamDto.prototype, "className", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Date),
    (0, class_validator_1.IsDate)({ message: '考试日期格式不正确' }),
    __metadata("design:type", Date)
], UpdateExamDto.prototype, "examDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '总分必须是数字' }),
    __metadata("design:type", Number)
], UpdateExamDto.prototype, "totalScore", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ExamType, { message: '考试类型不正确' }),
    __metadata("design:type", String)
], UpdateExamDto.prototype, "examType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(ExamStatus, { message: '考试状态不正确' }),
    __metadata("design:type", String)
], UpdateExamDto.prototype, "status", void 0);
//# sourceMappingURL=update-exam.dto.js.map