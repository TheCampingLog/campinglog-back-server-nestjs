import { ApiProperty } from '@nestjs/swagger';

// 마이 페이지 조회
export class ResponseGetMemberProfileImageDto {
  @ApiProperty()
  profileImage: string;
}
