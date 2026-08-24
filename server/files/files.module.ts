import {Module} from '@nestjs/common';
import {SupabaseModule} from '../supabase/supabase.module.js';
import {FilesController} from './files.controller.js';
import {FilesService} from './files.service.js';
@Module({imports:[SupabaseModule],controllers:[FilesController],providers:[FilesService],exports:[FilesService]})
export class FilesModule{}
