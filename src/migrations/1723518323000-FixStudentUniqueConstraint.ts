import { MigrationInterface, QueryRunner } from 'typeorm';

export class FixStudentUniqueConstraint1723518323000 implements MigrationInterface {
    name = 'FixStudentUniqueConstraint1723518323000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // 删除旧的唯一约束（如果存在）
        try {
            await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_number"`);
        } catch (error) {
            console.log('旧的学号唯一索引不存在，跳过删除');
        }

        // 创建新的复合唯一约束
        try {
            await queryRunner.query(`CREATE UNIQUE INDEX "IDX_student_number_class" ON "students" ("student_number", "class_id")`);
            console.log('成功创建学号-班级复合唯一约束');
        } catch (error) {
            console.log('复合唯一约束已存在或创建失败:', error.message);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 删除复合唯一约束
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_number_class"`);
        
        // 恢复旧的唯一约束
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_student_number" ON "students" ("student_number")`);
    }
}