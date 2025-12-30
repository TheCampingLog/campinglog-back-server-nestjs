import { ApiProperty } from '@nestjs/swagger';
import { ResponseGetMemberBoardDto } from './response-get-member-board.dto';

// 내가 쓴 글 조회
export class ResponseGetMemberBoardListDto {
  @ApiProperty({ type: () => [ResponseGetMemberBoardDto] })
  items: ResponseGetMemberBoardDto[];
  page: number;
  @ApiProperty()
  size: number;
  @ApiProperty()
  totalElements: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  first: boolean;
  @ApiProperty()
  last: boolean;
}
