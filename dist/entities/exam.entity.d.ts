import { Score } from './score.entity';
import { User } from './user.entity';
import { Semester } from './semester.entity';
export declare class Exam {
    id: string;
    name: string;
    subject: string;
    className: string;
    examDate: Date;
    totalScore: number;
    examType: string;
    status: string;
    teacherId: string;
    semesterId: string;
    createdAt: Date;
    scores: Score[];
    teacher: User;
    semester: Semester;
}
