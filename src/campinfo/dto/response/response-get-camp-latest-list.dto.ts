import { ApiProperty } from '@nestjs/swagger';

export class ResponseGetCampLatestList {
  @ApiProperty({ type: 'string' })
  facltNm: string;
  @ApiProperty({ type: 'string' })
  doNm: string;
  @ApiProperty({ type: 'string' })
  sigunguNm: string;
  @ApiProperty({ type: 'string' })
  addr1: string;
  @ApiProperty({ type: 'string' })
  addr2: string;
  @ApiProperty({ type: 'string' })
  mapX: string;
  @ApiProperty({ type: 'string' })
  mapY: string;
  @ApiProperty({ type: 'string' })
  tel: string;
  @ApiProperty({ type: 'string' })
  sbrsCl: string;
  @ApiProperty({ type: 'string' })
  firstImageUrl: string;
  @ApiProperty({ type: 'number' })
  totalCount: number;
}
