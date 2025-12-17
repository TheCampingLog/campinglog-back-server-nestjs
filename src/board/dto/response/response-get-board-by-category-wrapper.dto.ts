import { ResponseGetBoardByCategory } from './response-get-board-by-category.dto';

export class ResponseGetBoardByCategoryWrapper {
  content: ResponseGetBoardByCategory[];
  totalPages: number;
  totalElements: number;
  pageNumber: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}
