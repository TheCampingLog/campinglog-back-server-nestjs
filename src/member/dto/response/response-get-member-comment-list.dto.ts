// 내가 쓴 댓글 리스트 조회
import { ResponseGetMemberCommentDto } from './response-get-member-comment.dto';
export interface ResponseGetMemberCommentListDto {
  items: ResponseGetMemberCommentDto[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
}
