import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveGradeLevel1723518321000 implements MigrationInterface {
    name = 'RemoveGradeLevel1723518321000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 移除 exams 表的 grade_level 字段
        await queryRunner.query(`ALTER TABLE "exams" DROP COLUMN "grade_level"`);
        
        // 移除 students 表的 grade_level 字段
        await queryRunner.query(`ALTER TABLE "students" DROP COLUMN "grade_level"`);
        
        // 移除 users 表的 grade_level 字段
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "grade_level"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 恢复 exams 表的 grade_level 字段
        await queryRunner.query(`ALTER TABLE "exams" ADD "grade_level" varchar`);
        
        // 恢复 students 表的 grade_level 字段
        await queryRunner.query(`ALTER TABLE "students" ADD "grade_level" varchar`);
        
        // 恢复 users 表的 grade_level 字段
        await queryRunner.query(`ALTER TABLE "users" ADD "grade_level" varchar`);
    }
}