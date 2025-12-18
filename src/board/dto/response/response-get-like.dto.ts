export class ResponseGetLikeDto {
  boardId: string;
  likeCount: number;

  constructor(boardId: string, likeCount: number) {
    this.boardId = boardId;
    this.likeCount = likeCount;
  }
}
