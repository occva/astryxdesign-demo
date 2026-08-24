import {IsString,MaxLength} from 'class-validator';
export class ImportDepartmentsDto {
  @IsString() @MaxLength(2_000_000) csv!:string;
}
