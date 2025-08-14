import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Student } from './student.entity';
import { Exam } from './exam.entity';
import { User } from './user.entity';

@Entity('scores')
export class Score {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'student_id' })
  studentId: string;

  @Column({ name: 'exam_id' })
  examId: string;
  
  @Column({ name: 'user_id', nullable: true })
  userId: string;

  @Column({ nullable: true })
  score: number;

  @Column({ name: 'is_absent', default: false })
  isAbsent: boolean;

  @Column({ nullable: true })
  rank: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Student, student => student.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'student_id' })
  student: Student;

  @ManyToOne(() => Exam, exam => exam.scores, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'exam_id' })
  exam: Exam;
  
  @ManyToOne(() => User, user => user.scores)
  @JoinColumn({ name: 'user_id' })
  user: User;
}