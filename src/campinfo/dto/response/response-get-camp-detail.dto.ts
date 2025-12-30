import { Exclude, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

@Exclude()
export class ResponseGetCampDetail {
  @ApiProperty()
  @Expose()
  facltNm: string; // 야영장명

  @ApiProperty()
  @Expose()
  lineIntro: string; // 한줄소개

  @ApiProperty()
  @Expose()
  intro: string; // 소개

  @ApiProperty()
  @Expose()
  hvofBgnde: string; // 휴장기간 휴무기간 시작일

  @ApiProperty()
  @Expose()
  hvofEnddle: string; // 휴장기간 휴무기간 종료일

  @ApiProperty()
  @Expose()
  featureNm: string; // 특징

  @ApiProperty()
  @Expose()
  induty: string; // 업종

  @ApiProperty()
  @Expose()
  lctCl: string; // 입지구분

  @ApiProperty()
  @Expose()
  addr1: string; // 주소

  @ApiProperty()
  @Expose()
  addr2: string; // 주소상세

  @ApiProperty()
  @Expose()
  tel: string; // 전화

  @ApiProperty()
  @Expose()
  homepage: string; // 홈페이지

  @ApiProperty()
  @Expose()
  resveUrl: string; // 예약 페이지

  @ApiProperty()
  @Expose()
  siteBottomCl1: string; // 잔디

  @ApiProperty()
  @Expose()
  siteBottomCl2: string; // 파쇄석

  @ApiProperty()
  @Expose()
  siteBottomCl3: string; // 테크

  @ApiProperty()
  @Expose()
  siteBottomCl4: string; // 자갈

  @ApiProperty()
  @Expose()
  siteBottomCl5: string; // 맨흙

  @ApiProperty()
  @Expose()
  operPdCl: string; // 운영기간

  @ApiProperty()
  @Expose()
  operDeCl: string; // 운영일

  @ApiProperty()
  @Expose()
  toiletCo: string; // 화장실 개수

  @ApiProperty()
  @Expose()
  swrmCo: string; // 샤워실 개수

  @ApiProperty()
  @Expose()
  wtrplCo: string; // 개수대 개수

  @ApiProperty()
  @Expose()
  sbrsCl: string; // 부대시설

  @ApiProperty()
  @Expose()
  firstImageUrl: string; // 대표이미지

  @ApiProperty()
  @Expose()
  animalCmgCl: string; // 애완동물 출입

  @ApiProperty()
  @Expose()
  eqpmnLendCl: string; // 캠핑장비 대여

  @ApiProperty()
  @Expose()
  posblFcltyCl: string; // 주변 이용가능시설

  @ApiProperty()
  @Expose()
  doNm: string;

  @ApiProperty()
  @Expose()
  sigunguNm: string;
}
