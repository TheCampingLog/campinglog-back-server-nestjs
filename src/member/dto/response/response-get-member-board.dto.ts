import { ApiProperty } from '@nestjs/swagger';

// 내가 쓴 글 조회
export class ResponseGetMemberBoardDto {
  @ApiProperty()
  title: string;
  @ApiProperty()
  content: string;
  @ApiProperty()
  boardImage: string;
  @ApiProperty()
  createdAt: Date;
  @ApiProperty()
  boardId: string;
}
