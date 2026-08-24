import {IsDateString, IsEmail, IsOptional, IsString, MaxLength, MinLength, ValidateIf} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name?: string;

  @IsOptional()
  @ValidateIf((_object, value) => value !== '')
  @IsEmail()
  @MaxLength(254)
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  phone?: string;

  @IsOptional() @IsString() @MaxLength(100) employeeNo?: string;
  @IsOptional() @IsString() @MaxLength(100) jobTitle?: string;
  @IsOptional() @IsString() @MaxLength(100) managerName?: string;
  @IsOptional() @IsString() @MaxLength(100) enterpriseWechat?: string;
  @IsOptional() @IsString() @MaxLength(200) emergencyContact?: string;
  @IsOptional() @IsString() @MaxLength(200) officeLocation?: string;
  @IsOptional() @ValidateIf((_object, value) => value !== '') @IsDateString() joinedAt?: string;
}
