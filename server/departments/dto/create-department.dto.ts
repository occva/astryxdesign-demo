import {Transform, Type} from 'class-transformer';
import {IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, MaxLength, Min} from 'class-validator';
import {emptyStringToNull} from '../../common/dto-fields.js';

export class CreateDepartmentDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_-]*$/)
  @MaxLength(100)
  code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  parent?: string;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsUUID()
  parentId?: string | null;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsUUID()
  ownerUserId?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  owner?: string;

  @IsOptional()
  @IsIn(['enabled', 'disabled'])
  status?: 'enabled' | 'disabled';

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
