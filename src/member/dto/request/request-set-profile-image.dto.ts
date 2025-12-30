import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

//프로필 사진 등록
export class RequestSetProfileImageDto {
  @ApiProperty()
  @IsNotEmpty({ message: 'profileImage(URL)는 필수입니다.' })
  @IsString()
  profileImage: string;
}
