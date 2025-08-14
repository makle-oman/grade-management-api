import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, OneToMany, BeforeInsert, BeforeUpdate, AfterLoad } from 'typeorm';
import { Exam } from './exam.entity';
import { Student } from './student.entity';
import { Score } from './score.entity';
import { Exclude, Transform } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  TEACHER = 'teacher',
  GRADE_LEADER = 'grade_leader'
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  username: string;

  @Column({ unique: true, nullable: true })
  email: string;

  @Column()
  @Exclude({ toPlainOnly: true })
  password: string;

  @Column()
  name: string;

  @Column({
    type: 'text',
    enum: UserRole,
    default: UserRole.TEACHER
  })
  role: UserRole;

  @Column({ name: 'subject', nullable: true })
  subject: string;

  @Column({ name: 'class_names', type: 'text', nullable: true })
  classNames: string; // JSON string array of class names

  private _classNamesArray: string[];

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Exam, exam => exam.teacher)
  exams: Exam[];

  @OneToMany(() => Student, student => student.teacher)
  students: Student[];
  
  @OneToMany(() => Score, score => score.user)
  scores: Score[];

  @AfterLoad()
  parseClassNames() {
    try {
      this._classNamesArray = this.classNames ? JSON.parse(this.classNames) : [];
    } catch (e) {
      this._classNamesArray = this.classNames ? this.classNames.split(',') : [];
    }
  }

  @BeforeInsert()
  @BeforeUpdate()
  stringifyClassNames() {
    if (this._classNamesArray) {
      this.classNames = JSON.stringify(this._classNamesArray);
    }
  }

  // Getter for classNames as array
  getClassNames(): string[] {
    if (!this._classNamesArray) {
      this.parseClassNames();
    }
    return this._classNamesArray;
  }

  // Setter for classNames as array
  setClassNames(classNames: string[] | string | null | undefined) {
    if (Array.isArray(classNames)) {
      this._classNamesArray = classNames;
      this.classNames = JSON.stringify(classNames);
    } else if (classNames === null || classNames === undefined) {
      this._classNamesArray = [];
      this.classNames = null;
    } else if (typeof classNames === 'string') {
      try {
        this._classNamesArray = JSON.parse(classNames);
        this.classNames = classNames;
      } catch (e) {
        this._classNamesArray = classNames.split(',').filter(Boolean);
        this.classNames = JSON.stringify(this._classNamesArray);
      }
    }
  }

  // Helper method to check if user has a specific class
  hasClass(className: string): boolean {
    return this.getClassNames().includes(className);
  }

  // Helper method to check if user has a specific role
  hasRole(role: UserRole): boolean {
    return this.role === role;
  }

  // Helper method to check if user is active
  isUserActive(): boolean {
    return this.isActive;
  }
}
