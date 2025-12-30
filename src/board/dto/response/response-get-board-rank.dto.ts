import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetBoardRankDto {
  @ApiProperty()
  boardId: string;

  @ApiProperty({ type: String, nullable: true })
  boardImage: string | null;

  @ApiProperty()
  title: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  rank: number;

  @ApiProperty()
  viewCount: number;
}
