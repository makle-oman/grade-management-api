import { Score } from './score.entity';
import { User } from './user.entity';
import { Class } from './class.entity';
export declare class Student {
    id: string;
    name: string;
    studentNumber: string;
    className: string;
    class: Class;
    classId: number;
    teacherId: string;
    createdAt: Date;
    scores: Score[];
    teacher: User | null;
}
