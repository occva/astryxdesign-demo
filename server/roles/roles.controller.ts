import {Body, Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query} from '@nestjs/common';
import {ResourceQueryDto} from '../common/resource-query.dto.js';
import {CreateRoleDto} from './dto/create-role.dto.js';
import {UpdateRoleDto} from './dto/update-role.dto.js';
import {RolesService} from './roles.service.js';
import {RequirePermission} from '../auth/auth.decorators.js';

@Controller('roles')
export class RolesController {
  constructor(@Inject(RolesService) private readonly service: RolesService) {}

  @RequirePermission('roles.read')
  @Get()
  findAll(@Query() query: ResourceQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('roles.create')
  @Post()
  create(@Body() dto: CreateRoleDto) {
    return this.service.create(dto);
  }

  @RequirePermission('roles.update')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateRoleDto) {
    return this.service.update(id, dto);
  }

  @RequirePermission('roles.delete')
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
