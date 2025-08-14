import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StudentsService } from './students/students.service';
import { ClassesService } from './classes/classes.service';

async function migrateStudentsToClasses() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  const studentsService = app.get(StudentsService);
  const classesService = app.get(ClassesService);

  try {
    console.log('开始迁移现有学生到班级系统...');

    // 获取所有学生
    const students = await studentsService.findAll();
    console.log(`找到 ${students.length} 个学生需要迁移`);

    // 统计班级名称
    const classNames = new Set<string>();
    students.forEach(student => {
      if (student.className) {
        classNames.add(student.className);
      }
    });

    console.log(`发现 ${classNames.size} 个不同的班级: ${Array.from(classNames).join(', ')}`);

    // 为每个班级名称创建或查找班级
    const classMap = new Map<string, number>();
    
    for (const className of classNames) {
      try {
        // 先查找是否已存在
        const existingClasses = await classesService.findAll();
        let classEntity = existingClasses.find(c => c.name === className);
        
        if (!classEntity) {
          // 如果不存在，创建新班级
          const gradeMatch = className.match(/^([一二三四五六七八九十]+)/);
          const grade = gradeMatch ? `${gradeMatch[1]}年级` : '未知年级';
          
          classEntity = await classesService.create({
            name: className,
            grade: grade,
            description: `从现有学生数据迁移创建的班级：${className}`,
            isActive: true
          });
          
          console.log(`✅ 创建班级: ${className} (ID: ${classEntity.id})`);
        } else {
          console.log(`✅ 找到现有班级: ${className} (ID: ${classEntity.id})`);
        }
        
        classMap.set(className, classEntity.id);
      } catch (error) {
        console.error(`❌ 处理班级 ${className} 时出错:`, error.message);
      }
    }

    // 更新学生的班级ID
    let updatedCount = 0;
    let errorCount = 0;

    for (const student of students) {
      try {
        if (student.className && classMap.has(student.className)) {
          const classId = classMap.get(student.className);
          
          // 更新学生的班级ID
          await studentsService.update(student.id, {
            classId: classId
          });
          
          updatedCount++;
          console.log(`✅ 更新学生: ${student.name} (学号: ${student.studentNumber}) -> 班级ID: ${classId}`);
        } else {
          console.log(`⚠️  跳过学生: ${student.name} (无班级信息或班级创建失败)`);
        }
      } catch (error) {
        errorCount++;
        console.error(`❌ 更新学生 ${student.name} 时出错:`, error.message);
      }
    }

    console.log('\n=== 迁移完成 ===');
    console.log(`✅ 成功创建/找到班级: ${classMap.size} 个`);
    console.log(`✅ 成功更新学生: ${updatedCount} 个`);
    console.log(`❌ 更新失败: ${errorCount} 个`);
    
    // 验证结果
    console.log('\n=== 验证结果 ===');
    const updatedStudents = await studentsService.findAll();
    const studentsWithClass = updatedStudents.filter(s => s.classId);
    console.log(`有班级ID的学生数量: ${studentsWithClass.length}/${updatedStudents.length}`);
    
    // 按班级统计
    const classCounts = new Map<number, number>();
    studentsWithClass.forEach(student => {
      const count = classCounts.get(student.classId) || 0;
      classCounts.set(student.classId, count + 1);
    });
    
    console.log('\n各班级学生数量:');
    for (const [classId, count] of classCounts) {
      const className = Array.from(classMap.entries()).find(([name, id]) => id === classId)?.[0];
      console.log(`  ${className} (ID: ${classId}): ${count} 个学生`);
    }

  } catch (error) {
    console.error('迁移过程中发生错误:', error);
  } finally {
    await app.close();
  }
}

// 运行迁移
migrateStudentsToClasses().catch(console.error);