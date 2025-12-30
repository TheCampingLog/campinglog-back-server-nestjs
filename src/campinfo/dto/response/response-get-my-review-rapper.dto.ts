import { ApiProperty } from '@nestjs/swagger';
import { ResponseGetMyReviewList } from './response-get-my-review-list.dto';

export class ResponseGetMyReviewWrapper {
  @ApiProperty({ type: () => [ResponseGetMyReviewList] })
  content: ResponseGetMyReviewList[];
  @ApiProperty()
  page: number;
  @ApiProperty()
  size: number;
  @ApiProperty()
  totalElements: number;
  @ApiProperty()
  totalPage: number;
  @ApiProperty()
  hasNext: boolean;
}
