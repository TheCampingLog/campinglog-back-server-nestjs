import { ApiProperty } from '@nestjs/swagger';
import { ResponseGetCampByKeywordList } from '../response/response-get-camp-by-keyword-list.dto';

export class CampKeywordResponse {
  @ApiProperty({ type: [ResponseGetCampByKeywordList] })
  items: ResponseGetCampByKeywordList[];

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
