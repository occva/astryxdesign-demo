import {Transform, Type} from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';
import {emptyStringToNull} from '../../common/dto-fields.js';
import {validMenuIconNames} from '../menu-icon-names.js';

export class CreateMenuDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^[A-Za-z][A-Za-z0-9_-]*$/)
  @MaxLength(100)
  code!: string;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsUUID()
  parentId?: string | null;

  @IsString()
  @Matches(/^\//)
  @MaxLength(300)
  path!: string;

  @IsOptional()
  @IsIn(validMenuIconNames, {message: 'icon must use a supported Phosphor icon export name'})
  icon?: string;

  @IsOptional()
  @IsIn(['', 'dashboard', 'users', 'roles', 'departments', 'organization', 'menus', 'audit_logs', 'files'])
  componentKey?: string;

  @IsOptional()
  @IsIn(['enabled', 'disabled'])
  status?: 'enabled' | 'disabled';

  @IsOptional()
  @IsBoolean()
  visible?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  sort?: string;
}
