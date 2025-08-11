import { StudentsService } from './students.service';
import { Student } from '../entities/student.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
export declare class StudentsController {
    private readonly studentsService;
    constructor(studentsService: StudentsService);
    findAll(): Promise<Student[]>;
    findOne(id: string): Promise<Student>;
    findByClass(className: string): Promise<Student[]>;
    create(createStudentDto: CreateStudentDto): Promise<Student>;
    update(id: string, updateStudentDto: UpdateStudentDto): Promise<Student>;
    remove(id: string): Promise<void>;
    importMany(students: CreateStudentDto[]): Promise<Student[]>;
}
