import {Body, Controller, Delete, Get, Header, Inject, Param, ParseUUIDPipe, Patch, Post, Query} from '@nestjs/common';
import {RequirePermission} from '../auth/auth.decorators.js';
import {ResourceQueryDto} from '../common/resource-query.dto.js';
import {DepartmentsService} from './departments.service.js';
import {CreateDepartmentDto} from './dto/create-department.dto.js';
import {UpdateDepartmentDto} from './dto/update-department.dto.js';
import {ImportDepartmentsDto} from './dto/import-departments.dto.js';

@Controller('departments')
export class DepartmentsController {
  constructor(@Inject(DepartmentsService) private readonly service: DepartmentsService) {}

  @RequirePermission('departments.read')
  @Get()
  findAll(@Query() query: ResourceQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('departments.read') @Get('tree') tree(){return this.service.tree();}

  @RequirePermission('departments.read') @Get('export')
  @Header('Content-Type','text/csv; charset=utf-8')
  @Header('Content-Disposition','attachment; filename="departments.csv"')
  exportCsv(){return this.service.exportCsv();}

  @RequirePermission('departments.import') @Post('import/preview')
  previewImport(@Body() dto:ImportDepartmentsDto){return this.service.previewImport(dto.csv);}

  @RequirePermission('departments.import') @Post('import')
  importCsv(@Body() dto:ImportDepartmentsDto){return this.service.importCsv(dto.csv);}

  @RequirePermission('departments.create')
  @Post()
  create(@Body() dto: CreateDepartmentDto) {
    return this.service.create(dto);
  }

  @RequirePermission('departments.update')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateDepartmentDto) {
    return this.service.update(id, dto);
  }

  @RequirePermission('departments.delete')
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
