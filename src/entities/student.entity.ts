import { Entity, Column, PrimaryGeneratedColumn, OneToMany, CreateDateColumn, ManyToOne, JoinColumn, Unique } from 'typeorm';
import { Score } from './score.entity';
import { User } from './user.entity';
import { Class } from './class.entity';

@Entity('students')
@Unique(['studentNumber', 'classId'])
export class Student {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ name: 'student_number' })
  studentNumber: string;

  @Column({ name: 'class' })
  className: string;

  @ManyToOne(() => Class, classEntity => classEntity.students, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'class_id' })
  class: Class;

  @Column({ name: 'class_id', nullable: true })
  classId: number;

  @Column({ name: 'teacher_id', nullable: true })
  teacherId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @OneToMany(() => Score, score => score.student)
  scores: Score[];

  @ManyToOne(() => User, user => user.students, { nullable: true })
  @JoinColumn({ name: 'teacher_id' })
  teacher: User | null;
}
