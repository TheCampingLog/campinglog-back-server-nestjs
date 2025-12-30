import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

//마이페이지 수정 전 비밀번호 확인
export class ReqeustVerifyPasswordDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'password는 필수입니다.' })
  @IsString()
  password: string;
}
