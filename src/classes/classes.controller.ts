import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../entities/user.entity';

@Controller('classes')
@UseGuards(AuthGuard('jwt'))
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.GRADE_LEADER, UserRole.TEACHER)
  create(@Body() createClassDto: CreateClassDto, @Request() req) {
    const { userId } = req.user;
    return this.classesService.create(createClassDto, userId);
  }

  @Get()
  async findAll(@Request() req) {
    const { userId, role, classNames } = req.user;
    return this.classesService.findAll(userId, role, classNames);
  }

  @Get('active')
  async findActive(@Request() req) {
    const { userId, role, classNames } = req.user;
    return this.classesService.findActive(userId, role, classNames);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req) {
    const { userId, role, classNames } = req.user;
    return this.classesService.findOne(+id, userId, role, classNames);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto, @Request() req) {
    const { userId, role, classNames } = req.user;
    return this.classesService.update(+id, updateClassDto, userId, role, classNames);
  }

  @Patch(':id/toggle-active')
  async toggleActive(@Param('id') id: string, @Request() req) {
    const { userId, role, classNames } = req.user;
    return this.classesService.toggleActive(+id, userId, role, classNames);
  }

  @Delete(':id')
  async remove(@Param('id') id: string, @Request() req) {
    const { userId, role, classNames } = req.user;
    return this.classesService.remove(+id, userId, role, classNames);
  }
}