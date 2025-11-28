import { Expose, Exclude } from 'class-transformer';

@Exclude()
export class ResponseGetCampLatestList {
  @Expose() facltNm: string;
  @Expose() doNm: string;
  @Expose() sigunguNm: string;
  @Expose() addr1: string;
  @Expose() addr2: string;
  @Expose() mapX: string;
  @Expose() mapY: string;
  @Expose() tel: string;
  @Expose() sbrsCl: string;
  @Expose() firstImageUrl: string;
  @Expose() totalCount: number;
}
