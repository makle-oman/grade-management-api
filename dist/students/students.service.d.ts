import { Repository } from 'typeorm';
import { Student } from '../entities/student.entity';
import { Class } from '../entities/class.entity';
import { User } from '../entities/user.entity';
import { Score } from '../entities/score.entity';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import { UserRole } from '../entities/user.entity';
export declare class StudentsService {
    private studentsRepository;
    private classRepository;
    private userRepository;
    private scoreRepository;
    constructor(studentsRepository: Repository<Student>, classRepository: Repository<Class>, userRepository: Repository<User>, scoreRepository: Repository<Score>);
    private findOrCreateClass;
    private addClassToTeacher;
    findAll(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]>;
    findOne(id: string, userId?: string, userRole?: UserRole): Promise<Student>;
    findByClass(className: string, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]>;
    findByClassId(classId: number, userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]>;
    findByTeacher(teacherId: string): Promise<Student[]>;
    create(createStudentDto: CreateStudentDto, teacherId?: string): Promise<Student>;
    update(id: string, updateStudentDto: UpdateStudentDto, userId?: string, userRole?: UserRole): Promise<Student>;
    remove(id: string, userId?: string, userRole?: UserRole): Promise<void>;
    batchRemove(ids: string[], userId?: string, userRole?: UserRole): Promise<void>;
    importMany(students: CreateStudentDto[], teacherId: string, selectedClassId?: number): Promise<Student[]>;
    findAllIncludingInactive(userId?: string, userRole?: UserRole, userClassNames?: string[]): Promise<Student[]>;
    batchAssociateToClasses(): Promise<number>;
}
