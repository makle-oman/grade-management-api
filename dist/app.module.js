"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const students_module_1 = require("./students/students.module");
const exams_module_1 = require("./exams/exams.module");
const scores_module_1 = require("./scores/scores.module");
const path_1 = require("path");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
            }),
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    type: 'sqlite',
                    database: configService.get('DB_FILE', (0, path_1.join)(__dirname, '..', 'data', 'grade_management.sqlite')),
                    entities: [__dirname + '/**/*.entity{.ts,.js}'],
                    synchronize: configService.get('DB_SYNC', true),
                }),
            }),
            students_module_1.StudentsModule,
            exams_module_1.ExamsModule,
            scores_module_1.ScoresModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map