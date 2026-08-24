import {Type} from 'class-transformer';
import {IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min} from 'class-validator';

export class ResourceQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(1_000_000) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) pageSize?: number;
  @IsOptional() @IsString() @MaxLength(100) name?: string;
  @IsOptional() @IsString() @MaxLength(100) phone?: string;
  @IsOptional() @IsString() @MaxLength(30) status?: string;
  @IsOptional() @IsString() @MaxLength(40) createdAt?: string;
  @IsOptional() @IsString() @MaxLength(100) code?: string;
  @IsOptional() @IsString() @MaxLength(40) updatedAt?: string;
  @IsOptional() @IsString() @MaxLength(100) owner?: string;
  @IsOptional() @IsString() @MaxLength(300) path?: string;
  @IsOptional() @IsString() @MaxLength(100) sortKey?: string;
  @IsOptional() @IsIn(['asc', 'desc']) sortDirection?: 'asc' | 'desc';
  @IsOptional() @IsString() @MaxLength(100) actor?: string;
  @IsOptional() @IsString() @MaxLength(100) resourceType?: string;
  @IsOptional() @IsString() @MaxLength(100) action?: string;
  @IsOptional() @IsString() @MaxLength(50) from?: string;
  @IsOptional() @IsString() @MaxLength(50) to?: string;
  @IsOptional() @IsString() @MaxLength(255) fileName?: string;
  @IsOptional() @IsString() @MaxLength(255) mimeType?: string;

  [key: string]: string | number | undefined;
}
