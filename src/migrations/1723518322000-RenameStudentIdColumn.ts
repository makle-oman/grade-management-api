import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameStudentIdColumn1723518322000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // 先添加新列
        await queryRunner.query(`ALTER TABLE students ADD COLUMN student_number VARCHAR`);
        
        // 复制数据
        await queryRunner.query(`UPDATE students SET student_number = student_id`);
        
        // 添加复合唯一约束（学号在同一班级内唯一）
        await queryRunner.query(`CREATE UNIQUE INDEX idx_student_number_class ON students (student_number, class_id)`);
        
        // 更新外键引用
        // 注意：我们不删除 student_id 列，因为它可能被用作外键
        // 但我们确保所有新数据使用 student_number
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // 移除复合唯一约束
        await queryRunner.query(`DROP INDEX idx_student_number_class`);
        
        // 删除新列
        await queryRunner.query(`ALTER TABLE students DROP COLUMN student_number`);
    }
}