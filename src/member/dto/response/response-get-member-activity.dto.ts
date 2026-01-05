import { ApiProperty } from '@nestjs/swagger';

// 내 활동 조회
export class ResponseGetMemberActivityDto {
  @ApiProperty()
  email: string;
  @ApiProperty()
  boardCount: number;
  @ApiProperty()
  commentCount: number;
  @ApiProperty()
  reviewCount: number;
  @ApiProperty()
  likeCount: number;
}
