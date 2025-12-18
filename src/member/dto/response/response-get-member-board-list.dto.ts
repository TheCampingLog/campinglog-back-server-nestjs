import { ResponseGetMemberBoardDto } from './response-get-member-board.dto';

// 내가 쓴 글 조회
export interface ResponseGetMemberBoardListDto {
  items: ResponseGetMemberBoardDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
