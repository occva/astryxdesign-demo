import {Transform} from 'class-transformer';
import {
  IsArray,
  ArrayUnique,
  IsDateString,
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  IsUrl,
  IsUUID,
  Matches,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import {emptyStringToNull, emptyStringToUndefined} from '../../common/dto-fields.js';

export class CreateUserDto {
  @IsString()
  @MaxLength(100)
  name!: string;

  @IsString()
  @Matches(/^[A-Za-z0-9][A-Za-z0-9_-]{2,99}$/)
  @MaxLength(100)
  account!: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  employeeNo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  jobTitle?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  managerName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  enterpriseWechat?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  officeLocation?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsDateString()
  joinedAt?: string;

  @IsOptional()
  @Transform(emptyStringToUndefined)
  @IsUrl({require_tld: false})
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  gender?: string;

  @IsOptional()
  @IsIn(['normal', 'disabled'])
  status?: 'normal' | 'disabled';

  @IsOptional()
  @IsString()
  @MaxLength(100)
  department?: string;

  @IsOptional()
  @Transform(emptyStringToNull)
  @IsUUID()
  departmentId?: string | null;

  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsUUID('4', {each: true})
  roleIds?: string[];

  @IsOptional()
  @IsArray()
  @IsString({each: true})
  tags?: string[];

}
