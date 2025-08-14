import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const dataSource = app.get(DataSource);
  
  try {
    // 运行待处理的迁移
    const migrations = await dataSource.runMigrations();
    console.log(`成功运行了 ${migrations.length} 个迁移`);
    
    for (const migration of migrations) {
      console.log(`- ${migration.name}`);
    }
  } catch (error) {
    console.error('迁移过程中出错:', error);
  } finally {
    await app.close();
  }
}

bootstrap();
