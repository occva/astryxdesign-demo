import {IsInt,IsOptional,IsString,Matches,MaxLength,Min} from 'class-validator';
import {Type} from 'class-transformer';

export class CreateFileLinkDto {
  @IsString() @Matches(/^[a-z][a-z0-9_]*$/) @MaxLength(100) resourceType!:string;
  @IsString() @MaxLength(200) resourceId!:string;
  @IsString() @Matches(/^[A-Za-z][A-Za-z0-9_-]*$/) @MaxLength(100) fieldKey!:string;
  @IsOptional() @Type(()=>Number) @IsInt() @Min(0) sortOrder?:number;
}
