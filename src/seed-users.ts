import { DataSource } from 'typeorm';
import { User, UserRole } from './entities/user.entity';
import { Semester } from './entities/semester.entity';
import * as bcrypt from 'bcrypt';

async function seed() {
  const dataSource = new DataSource({
    type: 'sqlite',
    database: './data/grade_management.sqlite',
    entities: [__dirname + '/**/*.entity{.ts,.js}'],
    synchronize: true,
  });

  await dataSource.initialize();

  const userRepository = dataSource.getRepository(User);
  const semesterRepository = dataSource.getRepository(Semester);

  // 创建默认管理员用户
  const adminExists = await userRepository.findOne({ where: { username: 'admin' } });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    const admin = userRepository.create({
      username: 'admin',
      email: 'admin@school.com',
      password: hashedPassword,
      name: '系统管理员',
      role: UserRole.ADMIN,
      isActive: true,
    });
    await userRepository.save(admin);
    console.log('默认管理员用户已创建: admin/admin123');
  }

  // 创建示例教师用户
  const teacherExists = await userRepository.findOne({ where: { username: 'teacher1' } });
  if (!teacherExists) {
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    const teacher = userRepository.create({
      username: 'teacher1',
      email: 'teacher1@school.com',
      password: hashedPassword,
      name: '张老师',
      role: UserRole.TEACHER,
      subject: '数学',
      classNames: JSON.stringify(['高一(1)班', '高一(2)班']),
      isActive: true,
    });
    await userRepository.save(teacher);
    console.log('示例教师用户已创建: teacher1/teacher123');
  }

  // 创建年级组长用户
  const gradeLeaderExists = await userRepository.findOne({ where: { username: 'grade_leader1' } });
  if (!gradeLeaderExists) {
    const hashedPassword = await bcrypt.hash('leader123', 10);
    const gradeLeader = userRepository.create({
      username: 'grade_leader1',
      email: 'leader1@school.com',
      password: hashedPassword,
      name: '李组长',
      role: UserRole.GRADE_LEADER,
      isActive: true,
    });
    await userRepository.save(gradeLeader);
    console.log('年级组长用户已创建: grade_leader1/leader123');
  }

  // 创建默认学期
  const currentSemester = await semesterRepository.findOne({ where: { isCurrent: true } });
  if (!currentSemester) {
    const semester = semesterRepository.create({
      name: '2024-2025学年第一学期',
      schoolYear: '2024-2025',
      startDate: new Date('2024-09-01'),
      endDate: new Date('2025-01-31'),
      isCurrent: true,
    });
    await semesterRepository.save(semester);
    console.log('默认学期已创建');
  }

  await dataSource.destroy();
  console.log('数据库种子数据初始化完成');
}

seed().catch(console.error);