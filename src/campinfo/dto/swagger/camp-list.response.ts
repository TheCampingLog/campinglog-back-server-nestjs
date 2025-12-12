import { ApiProperty } from '@nestjs/swagger';
import { ResponseGetCampLatestList } from '../response/response-get-camp-latest-list.dto';

export class CampListResponse {
  @ApiProperty({ type: [ResponseGetCampLatestList] })
  items: ResponseGetCampLatestList[];

  @ApiProperty()
  page: number;

  @ApiProperty()
  size: number;

  @ApiProperty()
  totalCount: number;

  @ApiProperty()
  totalPage: number;

  @ApiProperty()
  hasNext: boolean;
}
