import {IsString, MaxLength, MinLength} from 'class-validator';

export class LoginDto {
  @IsString()
  @MaxLength(100)
  account!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(200)
  password!: string;
}
