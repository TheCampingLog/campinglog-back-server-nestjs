import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetCampWrapper<T> {
  @ApiProperty({ isArray: true })
  items: T[];
  @ApiProperty({ type: 'number' })
  page: number;
  @ApiProperty({ type: 'number' })
  size: number;
  @ApiProperty({ type: 'number' })
  totalCount: number;
  @ApiProperty({ type: 'number' })
  totalPage: number;
  @ApiProperty({ type: 'boolean' })
  hasNext: boolean;
}
