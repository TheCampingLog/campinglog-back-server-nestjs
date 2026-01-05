import { ApiProperty } from '@nestjs/swagger';
import { ResponseGetReviewList } from './response-get-review-list.dto';

export class ResponseGetReviewListWrapper {
  @ApiProperty({ type: () => [ResponseGetReviewList] })
  items: ResponseGetReviewList[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  hasNext: boolean;

  @ApiProperty()
  totalElement: number;

  @ApiProperty()
  totalPages: number;
}
