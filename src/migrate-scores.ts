import { DataSource } from 'typeorm';
import { Score } from './entities/score.entity';
import { User } from './entities/user.entity';

async function migrateScores() {
  console.log('开始迁移成绩记录...');
  
  const dataSource = new DataSource({
    type: 'sqlite',
    database: './data/grade_management.sqlite',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();
  console.log('数据库连接已初始化');

  const scoreRepository = dataSource.getRepository(Score);
  const userRepository = dataSource.getRepository(User);

  // 获取默认管理员用户
  const adminUser = await userRepository.findOne({ where: { username: 'admin' } });
  if (!adminUser) {
    console.error('未找到管理员用户，请先运行 npm run db:seed-users');
    await dataSource.destroy();
    return;
  }

  // 获取所有没有关联用户的成绩记录
  const scores = await scoreRepository.find({
    where: { userId: null }
  });

  console.log(`找到 ${scores.length} 条没有关联用户的成绩记录`);

  if (scores.length > 0) {
    // 将所有成绩记录关联到管理员用户
    for (const score of scores) {
      score.userId = adminUser.id;
    }

    await scoreRepository.save(scores);
    console.log(`已将 ${scores.length} 条成绩记录关联到管理员用户`);
  } else {
    console.log('没有需要迁移的成绩记录');
  }

  await dataSource.destroy();
  console.log('成绩记录迁移完成');
}

migrateScores().catch(error => {
  console.error('迁移过程中发生错误:', error);
  process.exit(1);
});