import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetLikeDto {
  @ApiProperty()
  boardId: string;

  @ApiProperty()
  likeCount: number;

  constructor(boardId: string, likeCount: number) {
    this.boardId = boardId;
    this.likeCount = likeCount;
  }
}
