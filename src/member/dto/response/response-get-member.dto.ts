import { ApiProperty } from '@nestjs/swagger';

// 마이 페이지 조회
export class ResponseGetMemberDto {
  @ApiProperty()
  email: string;
  @ApiProperty()
  name: string;
  @ApiProperty()
  nickname: string;
  @ApiProperty()
  birthday: Date;
  @ApiProperty()
  phoneNumber: string;
  @ApiProperty()
  profileImage: string;
  @ApiProperty()
  role: string;
  @ApiProperty()
  memberGrade: string;
  @ApiProperty()
  joinDate: Date;
}
