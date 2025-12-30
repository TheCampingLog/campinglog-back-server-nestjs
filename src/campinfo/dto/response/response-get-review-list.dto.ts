import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseGetReviewList {
  @ApiProperty()
  email: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  reviewContent: string;

  @ApiProperty()
  reviewScore: number;

  @ApiPropertyOptional()
  reviewImage?: string;

  @ApiProperty()
  createAt: Date;

  @ApiProperty()
  updateAt: Date;
}
