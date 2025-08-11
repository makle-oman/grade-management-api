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
exports.ImportScoresDto = void 0;
const class_validator_1 = require("class-validator");
const class_transformer_1 = require("class-transformer");
class ScoreImportItem {
    constructor() {
        this.isAbsent = false;
    }
}
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '学生ID不能为空' }),
    (0, class_validator_1.IsString)({ message: '学生ID必须是字符串' }),
    __metadata("design:type", String)
], ScoreImportItem.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsNotEmpty)({ message: '考试ID不能为空' }),
    (0, class_validator_1.IsString)({ message: '考试ID必须是字符串' }),
    __metadata("design:type", String)
], ScoreImportItem.prototype, "examId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)({}, { message: '成绩必须是数字' }),
    __metadata("design:type", Number)
], ScoreImportItem.prototype, "score", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)({ message: '缺考标记必须是布尔值' }),
    __metadata("design:type", Boolean)
], ScoreImportItem.prototype, "isAbsent", void 0);
class ImportScoresDto {
}
exports.ImportScoresDto = ImportScoresDto;
__decorate([
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => ScoreImportItem),
    (0, class_validator_1.ArrayMinSize)(1, { message: '至少需要一条成绩记录' }),
    __metadata("design:type", Array)
], ImportScoresDto.prototype, "scores", void 0);
//# sourceMappingURL=import-scores.dto.js.map