import {IsIn, IsOptional, IsString, Matches, MaxLength} from 'class-validator';

export class CreateRoleDto {
  @IsString() @MaxLength(100) name!: string;
  @IsString() @Matches(/^[A-Za-z][A-Za-z0-9_-]*$/) @MaxLength(100) code!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
  @IsOptional() @IsString() @MaxLength(500) scope?: string;
  @IsOptional() @IsIn(['enabled', 'disabled']) status?: 'enabled' | 'disabled';
}
