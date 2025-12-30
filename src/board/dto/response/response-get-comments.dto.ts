import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetCommentsDto {
  @ApiProperty()
  commentId: string;

  @ApiProperty()
  content: string;

  @ApiProperty()
  nickname: string;

  @ApiProperty()
  email: string;

  @ApiProperty({ type: 'string' })
  createdAt: Date;
}
