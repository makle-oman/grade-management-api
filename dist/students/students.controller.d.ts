import { StudentsService } from './students.service';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    findAll(req: any): Promise<Student[]>;
    findAllIncludingInactive(req: any): Promise<Student[]>;
    findByTeacher(teacherId: string): Promise<Student[]>;
    findByClass(className: string, req: any): Promise<Student[]>;
    findByClassId(classId: string, req: any): Promise<Student[]>;
    findOne(id: string, req: any): Promise<Student>;
    create(createStudentDto: CreateStudentDto, req: any): Promise<Student>;
    update(id: string, updateStudentDto: UpdateStudentDto, req: any): Promise<Student>;
    remove(id: string, req: any): Promise<void>;
    batchRemove(ids: string, req: any): Promise<void>;
    importMany(students: CreateStudentDto[], req: any): Promise<Student[]>;
    batchAssociateClasses(): Promise<{
        message: string;
        updated: number;
    }>;
}
