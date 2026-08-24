import {Body, Controller, Delete, Get, Inject, Param, ParseUUIDPipe, Patch, Post, Query} from '@nestjs/common';
import {RequirePermission} from '../auth/auth.decorators.js';
import {ResourceQueryDto} from '../common/resource-query.dto.js';
import {CreateMenuDto} from './dto/create-menu.dto.js';
import {UpdateMenuDto} from './dto/update-menu.dto.js';
import {MenusService} from './menus.service.js';

@Controller('menus')
export class MenusController {
  constructor(@Inject(MenusService) private readonly service: MenusService) {}

  @RequirePermission('menus.read')
  @Get()
  findAll(@Query() query: ResourceQueryDto) {
    return this.service.findAll(query);
  }

  @RequirePermission('menus.create')
  @Post()
  create(@Body() dto: CreateMenuDto) {
    return this.service.create(dto);
  }

  @RequirePermission('menus.update')
  @Patch(':id')
  update(@Param('id', ParseUUIDPipe) id: string, @Body() dto: UpdateMenuDto) {
    return this.service.update(id, dto);
  }

  @RequirePermission('menus.delete')
  @Delete(':id')
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    await this.service.remove(id);
  }
}
