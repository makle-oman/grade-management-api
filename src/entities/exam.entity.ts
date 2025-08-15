import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Score } from './score.entity';
import { User } from './user.entity';
import { Semester } from './semester.entity';

@Entity('exams')
export class Exam {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  subject: string;

  @Column({ name: 'class_name' })
  className: string;

  @Column({ name: 'date' })
  examDate: Date;

  @Column({ name: 'total_score' })
  totalScore: number;

  @Column({ name: 'exam_type', default: 'other' })
  examType: string;

  @Column({ default: 'not_started' })
  status: string;

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @Column({ name: 'semester_id', nullable: true })
  semesterId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Score, score => score.exam)
  scores: Score[];

  @ManyToOne(() => User, user => user.exams, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User | null;

  @ManyToOne(() => Semester, semester => semester.exams)
  @JoinColumn({ name: 'semester_id' })
  semester: Semester;
}
