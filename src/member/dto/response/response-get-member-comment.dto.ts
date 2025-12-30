import { ApiProperty } from '@nestjs/swagger';

// 내가 쓴 댓글 리스트 조회
export class ResponseGetMemberCommentDto {
  @ApiProperty()
  commentId: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  nickname: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  boardId: string;
}
