import { ResponseGetCommentsDto } from './response-get-comments.dto';

export class ResponseGetCommentsWrapper {
  content: ResponseGetCommentsDto[];
  totalComments: number;
  totalPages: number;
  pageNumber: number;
  pageSize: number;
  isFirst: boolean;
  isLast: boolean;
}
