import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetBoardReview {
  @ApiProperty()
  reviewAverage: number;
  @ApiProperty()
  reviewCount: number;
}
