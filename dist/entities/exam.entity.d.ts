import { Score } from './score.entity';
export declare class Exam {
    id: string;
    name: string;
    subject: string;
    className: string;
    examDate: Date;
    totalScore: number;
    examType: string;
    status: string;
    createdAt: Date;
    scores: Score[];
}
