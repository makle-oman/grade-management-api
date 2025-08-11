import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn } from 'typeorm';
import { Score } from './score.entity';

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

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Score, score => score.exam)
  scores: Score[];
}