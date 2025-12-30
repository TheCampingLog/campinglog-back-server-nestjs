import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetMyReviewList {
  @ApiProperty()
  reviewContent: string; // review
  @ApiProperty()
  reviewScore: number; // review
  @ApiProperty({ type: 'string' })
  facltNm: string | null; // 외부 API
  @ApiProperty({ type: 'string' })
  firstImageUrl: string | null; // 외부 API
  @ApiProperty()
  mapX: string;
  @ApiProperty()
  mapY: string;
  @ApiProperty()
  createAt: Date;
  @ApiProperty()
  id: number;
}
