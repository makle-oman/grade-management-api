import { Student } from './student.entity';
import { Exam } from './exam.entity';
import { User } from './user.entity';
export declare class Score {
    id: string;
    studentId: string;
    examId: string;
    userId: string;
    score: number;
    isAbsent: boolean;
    rank: number;
    createdAt: Date;
    updatedAt: Date;
    student: Student;
    exam: Exam;
    user: User;
}
