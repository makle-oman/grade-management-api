import { DataSource } from 'typeorm';
import { Student } from './entities/student.entity';
import { Class } from './entities/class.entity';
import { User } from './entities/user.entity';
import { Exam } from './entities/exam.entity';
import { Score } from './entities/score.entity';
import { Semester } from './entities/semester.entity';

async function rebuildStudentsTable() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: 'data/grade_management.sqlite',
    entities: [Student, Class, User, Exam, Score, Semester],
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('数据库连接成功');

    const queryRunner = dataSource.createQueryRunner();

    // 1. 备份现有数据
    console.log('备份现有学生数据...');
    const existingStudents = await queryRunner.query(`
      SELECT id, name, student_number, class, class_id, teacher_id, created_at 
      FROM students
    `);
    console.log(`找到 ${existingStudents.length} 个学生记录`);

    // 2. 删除外键约束相关的表（临时）
    console.log('禁用外键约束...');
    await queryRunner.query(`PRAGMA foreign_keys = OFF`);

    // 3. 重命名原表
    console.log('重命名原表...');
    await queryRunner.query(`ALTER TABLE students RENAME TO students_backup`);

    // 4. 创建新的students表（只有复合唯一约束）
    console.log('创建新的students表...');
    await queryRunner.query(`
      CREATE TABLE "students" (
        "id" varchar PRIMARY KEY NOT NULL,
        "name" varchar NOT NULL,
        "student_number" varchar NOT NULL,
        "class" varchar NOT NULL,
        "class_id" integer,
        "teacher_id" varchar,
        "created_at" datetime NOT NULL DEFAULT (datetime('now')),
        CONSTRAINT "UQ_student_number_class" UNIQUE ("student_number", "class_id"),
        CONSTRAINT "FK_students_class" FOREIGN KEY ("class_id") REFERENCES "classes" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_students_teacher" FOREIGN KEY ("teacher_id") REFERENCES "users" ("id") ON DELETE NO ACTION
      )
    `);

    // 5. 恢复数据
    console.log('恢复学生数据...');
    for (const student of existingStudents) {
      try {
        await queryRunner.query(`
          INSERT INTO students (id, name, student_number, class, class_id, teacher_id, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [
          student.id,
          student.name,
          student.student_number,
          student.class,
          student.class_id,
          student.teacher_id,
          student.created_at
        ]);
      } catch (error) {
        console.log(`恢复学生 ${student.name} 时出错:`, error.message);
      }
    }

    // 6. 重新启用外键约束
    console.log('重新启用外键约束...');
    await queryRunner.query(`PRAGMA foreign_keys = ON`);

    // 7. 删除备份表
    console.log('删除备份表...');
    await queryRunner.query(`DROP TABLE students_backup`);

    // 8. 验证新表结构
    console.log('验证新表结构...');
    const indexes = await queryRunner.query(`PRAGMA index_list('students')`);
    console.log('新表的索引:', indexes);

    for (const index of indexes) {
      const indexInfo = await queryRunner.query(`PRAGMA index_info('${index.name}')`);
      console.log(`索引 ${index.name}:`, indexInfo);
    }

    await queryRunner.release();
    console.log('学生表重建完成！');

  } catch (error) {
    console.error('重建学生表时出错:', error);
  } finally {
    await dataSource.destroy();
  }
}

rebuildStudentsTable();