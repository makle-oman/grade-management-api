import { Score } from './score.entity';
export declare class Student {
    id: string;
    name: string;
    studentNumber: string;
    className: string;
    createdAt: Date;
    scores: Score[];
}
