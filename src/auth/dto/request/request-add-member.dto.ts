import {
  IsEmail,
  IsNotEmpty,
  IsString,
  Length,
  MaxLength,
  IsDateString,
} from 'class-validator';

export class RequestAddMemberDto {
  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(8, 100)
  password: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nickname: string;

  @IsNotEmpty()
  @IsDateString()
  birthday: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(20)
  phoneNumber: string;
}
