import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ResponseGetBoardReviewRankList {
  @ApiProperty()
  reviewAverage: number;

  @ApiPropertyOptional()
  firstImageUrl?: string;

  @ApiPropertyOptional()
  doNm?: string;

  @ApiPropertyOptional()
  sigunguNm?: string;

  @ApiProperty()
  mapX: string;

  @ApiProperty()
  mapY: string;

  @ApiPropertyOptional()
  facltNm?: string;
}
