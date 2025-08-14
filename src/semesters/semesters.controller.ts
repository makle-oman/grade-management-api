import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { SemestersService } from './semesters.service';
import { CreateSemesterDto } from './dto/create-semester.dto';
import { UpdateSemesterDto } from './dto/update-semester.dto';
import { UserRole } from '../entities/user.entity';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';

@Controller('semesters')
@UseGuards(AuthGuard('jwt'))
export class SemestersController {
  constructor(private readonly semestersService: SemestersService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.GRADE_LEADER)
  create(@Body() createSemesterDto: CreateSemesterDto) {
    return this.semestersService.create(createSemesterDto);
  }

  @Get()
  findAll() {
    return this.semestersService.findAll();
  }

  @Get('current')
  findCurrent() {
    return this.semestersService.findCurrent();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.semestersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.GRADE_LEADER)
  update(@Param('id') id: string, @Body() updateSemesterDto: UpdateSemesterDto) {
    return this.semestersService.update(id, updateSemesterDto);
  }

  @Patch(':id/set-current')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.GRADE_LEADER)
  setCurrent(@Param('id') id: string) {
    return this.semestersService.setCurrent(id);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.TEACHER, UserRole.GRADE_LEADER)
  remove(@Param('id') id: string) {
    return this.semestersService.remove(id);
  }
}