import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';
//비밀번호 수정
export class RequestChangePasswordDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsNotEmpty({ message: 'password는 필수입니다.' })
  @Length(8, 100)
  @IsString()
  newPassword: string;
}
