import { ResponseGetBoardByKeyword } from './response-get-board-by-keyword.dto';

export class ResponseGetBoardByKeywordWrapper {
  content: ResponseGetBoardByKeyword[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}
