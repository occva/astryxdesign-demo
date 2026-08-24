import {BadRequestException,Body,Controller,Delete,Get,Inject,Param,ParseUUIDPipe,Post,Query,Req,UploadedFile,UseInterceptors} from '@nestjs/common';
import {FileInterceptor} from '@nestjs/platform-express';
import {RequirePermission} from '../auth/auth.decorators.js';
import type {AuthenticatedUser} from '../auth/auth.service.js';
import {ResourceQueryDto} from '../common/resource-query.dto.js';
import {CreateFileLinkDto} from './dto/create-file-link.dto.js';
import {FilesService} from './files.service.js';

type RequestWithUser={authUser:AuthenticatedUser};
type Upload={originalname:string;mimetype:string;size:number;buffer:Buffer};

@Controller('files')
export class FilesController {
  constructor(@Inject(FilesService) private readonly files:FilesService){}
  @RequirePermission('files.read') @Get() findAll(@Query() query:ResourceQueryDto,@Req() request:RequestWithUser){return this.files.findAll(query,request.authUser);}
  @RequirePermission('files.upload') @Post() @UseInterceptors(FileInterceptor('file',{limits:{fileSize:20*1024*1024,files:1}}))
  upload(@UploadedFile() file:Upload|undefined,@Req() request:RequestWithUser){if(!file) throw new BadRequestException({code:'FILE_REQUIRED'});return this.files.upload(file,request.authUser);}
  @RequirePermission('files.download') @Post(':id/download') download(@Param('id',ParseUUIDPipe) id:string,@Req() request:RequestWithUser){return this.files.download(id,request.authUser);}
  @RequirePermission('files.download') @Post(':id/preview') preview(@Param('id',ParseUUIDPipe) id:string,@Req() request:RequestWithUser){return this.files.preview(id,request.authUser);}
  @RequirePermission('files.delete') @Delete(':id') async remove(@Param('id',ParseUUIDPipe) id:string,@Req() request:RequestWithUser){await this.files.remove(id,request.authUser);}
  @RequirePermission('files.link') @Post(':id/links') link(@Param('id',ParseUUIDPipe) id:string,@Body() dto:CreateFileLinkDto,@Req() request:RequestWithUser){return this.files.link(id,dto,request.authUser);}
  @RequirePermission('files.link') @Delete(':id/links/:linkId') async unlink(@Param('id',ParseUUIDPipe) id:string,@Param('linkId',ParseUUIDPipe) linkId:string,@Req() request:RequestWithUser){await this.files.unlink(id,linkId,request.authUser);}
}
