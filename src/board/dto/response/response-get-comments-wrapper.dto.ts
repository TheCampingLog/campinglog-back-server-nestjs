import { ResponseGetCommentsDto } from './response-get-comments.dto';

export class ResponseGetCommentsWrapperDto {
  comments: ResponseGetCommentsDto[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
}
