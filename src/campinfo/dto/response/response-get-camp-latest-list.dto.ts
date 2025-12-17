import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseGetCampLatestList {
  @ApiProperty({ type: 'string' })
  @Expose()
  facltNm: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  doNm: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  sigunguNm: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  addr1: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  addr2: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  mapX: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  mapY: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  tel: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  sbrsCl: string;
  @ApiProperty({ type: 'string' })
  @Expose()
  firstImageUrl: string;
}
