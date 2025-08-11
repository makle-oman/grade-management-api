import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { StudentsService } from './students/students.service';
import { ExamsService } from './exams/exams.service';
import { ScoresService } from './scores/scores.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const studentsService = app.get(StudentsService);
  const examsService = app.get(ExamsService);
  const scoresService = app.get(ScoresService);

  // 检查是否已有数据
  const existingStudents = await studentsService.findAll();
  const existingExams = await examsService.findAll();
  const existingScores = await scoresService.findAll();
  
  let students = existingStudents;
  let exams = existingExams;
  
  if (existingStudents.length === 0) {
    // 创建学生数据
    console.log('开始创建学生数据...');
    students = await Promise.all([
      studentsService.create({
        name: '张三',
        studentNumber: '2023001',
        className: '高三一班',
      }),
      studentsService.create({
        name: '李四',
        studentNumber: '2023002',
        className: '高三一班',
      }),
      studentsService.create({
        name: '王五',
        studentNumber: '2023003',
        className: '高三一班',
      }),
      studentsService.create({
        name: '赵六',
        studentNumber: '2023004',
        className: '高三二班',
      }),
      studentsService.create({
        name: '钱七',
        studentNumber: '2023005',
        className: '高三二班',
      }),
    ]);
    console.log(`创建了 ${students.length} 名学生`);
  } else {
    console.log(`数据库中已有 ${existingStudents.length} 名学生，跳过创建学生...`);
  }
  
  if (existingExams.length === 0) {
    // 创建考试数据
    console.log('开始创建考试数据...');
    exams = await Promise.all([
      examsService.create({
        name: '期中考试',
        subject: '数学',
        className: '高三一班',
        examDate: new Date('2023-10-15'),
        totalScore: 150,
        examType: 'midterm',
        status: 'completed',
      }),
      examsService.create({
        name: '期末考试',
        subject: '数学',
        className: '高三一班',
        examDate: new Date('2023-12-20'),
        totalScore: 150,
        examType: 'final',
        status: 'completed',
      }),
      examsService.create({
        name: '期中考试',
        subject: '语文',
        className: '高三一班',
        examDate: new Date('2023-10-16'),
        totalScore: 150,
        examType: 'midterm',
        status: 'completed',
      }),
      examsService.create({
        name: '期中考试',
        subject: '数学',
        className: '高三二班',
        examDate: new Date('2023-10-15'),
        totalScore: 150,
        examType: 'midterm',
        status: 'completed',
      }),
    ]);
    console.log(`创建了 ${exams.length} 场考试`);
  } else {
    console.log(`数据库中已有 ${existingExams.length} 场考试，跳过创建考试...`);
  }
  
  if (existingScores.length === 0) {
    // 创建成绩数据
    console.log('开始创建成绩数据...');
    const scores = [];
    
    // 确保我们有学生和考试数据
    if (students.length > 0 && exams.length > 0) {
      // 高三一班数学期中考试成绩
      const mathMidtermExam = exams.find(e => e.name === '期中考试' && e.subject === '数学' && e.className === '高三一班') || exams[0];
      const class1Students = students.filter(s => s.className === '高三一班');
      
      if (mathMidtermExam && class1Students.length > 0) {
        for (const student of class1Students) {
          scores.push({
            studentId: student.id,
            examId: mathMidtermExam.id,
            score: Math.floor(Math.random() * 50) + 100, // 100-150之间的随机分数
            isAbsent: false,
          });
        }
      }
      
      // 高三一班数学期末考试成绩
      const mathFinalExam = exams.find(e => e.name === '期末考试' && e.subject === '数学' && e.className === '高三一班');
      if (mathFinalExam && class1Students.length > 0) {
        for (const student of class1Students) {
          // 随机设置一个学生为缺考
          const isAbsent = student.name === '李四';
          scores.push({
            studentId: student.id,
            examId: mathFinalExam.id,
            score: isAbsent ? null : Math.floor(Math.random() * 50) + 100,
            isAbsent,
          });
        }
      }
      
      // 高三一班语文期中考试成绩
      const chineseMidtermExam = exams.find(e => e.name === '期中考试' && e.subject === '语文' && e.className === '高三一班');
      if (chineseMidtermExam && class1Students.length > 0) {
        for (const student of class1Students) {
          scores.push({
            studentId: student.id,
            examId: chineseMidtermExam.id,
            score: Math.floor(Math.random() * 50) + 100,
            isAbsent: false,
          });
        }
      }
      
      // 高三二班数学期中考试成绩
      const class2MathMidtermExam = exams.find(e => e.name === '期中考试' && e.subject === '数学' && e.className === '高三二班');
      const class2Students = students.filter(s => s.className === '高三二班');
      
      if (class2MathMidtermExam && class2Students.length > 0) {
        for (const student of class2Students) {
          scores.push({
            studentId: student.id,
            examId: class2MathMidtermExam.id,
            score: Math.floor(Math.random() * 50) + 100,
            isAbsent: false,
          });
        }
      }
      
      // 批量保存成绩
      const createdScores = await scoresService.importScores(scores);
      console.log(`创建了 ${createdScores.length} 条成绩记录`);
      
      // 计算排名
      for (const exam of exams) {
        await scoresService.calculateRanks(exam.id);
        console.log(`已计算考试 ${exam.name} - ${exam.subject} 的排名`);
      }
    } else {
      console.log('没有足够的学生或考试数据，跳过创建成绩...');
    }
  } else {
    console.log(`数据库中已有 ${existingScores.length} 条成绩记录，跳过创建成绩...`);
  }

  console.log('数据初始化完成！');
  await app.close();
}

bootstrap();