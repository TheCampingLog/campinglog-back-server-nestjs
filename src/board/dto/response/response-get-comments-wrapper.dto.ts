import { ApiProperty } from '@nestjs/swagger';
import { ResponseGetCommentsDto } from './response-get-comments.dto';
export class ResponseGetCommentsWrapper {
  @ApiProperty({ type: ResponseGetCommentsDto, isArray: true })
  content: ResponseGetCommentsDto[];
  @ApiProperty()
  totalComments: number;
  @ApiProperty()
  totalPages: number;
  @ApiProperty()
  pageNumber: number;
  @ApiProperty()
  pageSize: number;
  @ApiProperty()
  isFirst: boolean;
  @ApiProperty()
  isLast: boolean;
}
