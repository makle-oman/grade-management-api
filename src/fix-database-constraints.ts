import { DataSource } from 'typeorm';
import { Student } from './entities/student.entity';
import { Class } from './entities/class.entity';
import { User } from './entities/user.entity';
import { Exam } from './entities/exam.entity';
import { Score } from './entities/score.entity';
import { Semester } from './entities/semester.entity';

async function fixDatabaseConstraints() {
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

    // 1. 删除旧的学号唯一约束
    try {
      console.log('删除旧的学号唯一约束...');
      await queryRunner.query(`DROP INDEX IF EXISTS "IDX_student_number"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "UQ_students_student_number"`);
      await queryRunner.query(`DROP INDEX IF EXISTS "sqlite_autoindex_students_1"`);
      console.log('旧约束删除完成');
    } catch (error) {
      console.log('删除旧约束时出错（可能不存在）:', error.message);
    }

    // 2. 创建新的复合唯一约束
    try {
      console.log('创建新的复合唯一约束...');
      await queryRunner.query(`CREATE UNIQUE INDEX "IDX_student_number_class" ON "students" ("student_number", "class_id")`);
      console.log('新约束创建成功');
    } catch (error) {
      console.log('创建新约束时出错:', error.message);
    }

    // 3. 查看当前所有索引
    console.log('当前students表的所有索引:');
    const indexes = await queryRunner.query(`PRAGMA index_list('students')`);
    console.log(indexes);

    // 4. 查看具体索引信息
    for (const index of indexes) {
      const indexInfo = await queryRunner.query(`PRAGMA index_info('${index.name}')`);
      console.log(`索引 ${index.name}:`, indexInfo);
    }

    await queryRunner.release();
    console.log('数据库约束修复完成');

  } catch (error) {
    console.error('修复数据库约束时出错:', error);
  } finally {
    await dataSource.destroy();
  }
}

fixDatabaseConstraints();