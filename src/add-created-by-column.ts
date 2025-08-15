import { DataSource } from 'typeorm';
import { join } from 'path';

async function addCreatedByColumn() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: join(__dirname, '..', 'data', 'grade_management.sqlite'),
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: false,
  });

  try {
    await dataSource.initialize();
    console.log('数据库连接成功');

    // 检查列是否已存在
    const result = await dataSource.query(`PRAGMA table_info(classes)`);
    const hasCreatedByColumn = result.some((column: any) => column.name === 'created_by');

    if (!hasCreatedByColumn) {
      // 添加 created_by 列
      await dataSource.query(`ALTER TABLE classes ADD COLUMN created_by VARCHAR(36)`);
      console.log('成功添加 created_by 列到 classes 表');
    } else {
      console.log('created_by 列已存在');
    }

  } catch (error) {
    console.error('执行失败:', error);
  } finally {
    await dataSource.destroy();
  }
}

addCreatedByColumn();