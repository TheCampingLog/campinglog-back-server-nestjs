// 내가 쓴 댓글 리스트 조회
export interface ResponseGetMemberCommentDto {
  commentId: string;
  content: string;
  nickname: string;
  createdAt: Date;
  boardId: string;
}
