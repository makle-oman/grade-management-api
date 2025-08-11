declare class ScoreImportItem {
    studentId: string;
    examId: string;
    score?: number;
    isAbsent?: boolean;
}
export declare class ImportScoresDto {
    scores: ScoreImportItem[];
}
export {};
