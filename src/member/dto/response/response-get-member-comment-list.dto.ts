// 내가 쓴 댓글 리스트 조회
import { ApiProperty } from '@nestjs/swagger';
import { ResponseGetMemberCommentDto } from './response-get-member-comment.dto';
export class ResponseGetMemberCommentListDto {
  @ApiProperty({ type: () => [ResponseGetMemberCommentDto] })
  items: ResponseGetMemberCommentDto[];
  @ApiProperty()
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
