import { Exclude, Expose } from 'class-transformer';

@Exclude()
export class ResponseGetCampDetail {
  @Expose()
  facltNm: string; // 야영장명
  @Expose()
  lineIntro: string; // 한줄소개
  @Expose()
  intro: string; // 소개
  @Expose()
  hvofBgnde: string; // 휴장기간 휴무기간 시작일
  @Expose()
  hvofEnddle: string; // 휴장기간 휴무기간 종료일
  @Expose()
  featureNm: string; // 특징
  @Expose()
  induty: string; // 업종
  @Expose()
  lctCl: string; // 입지구분
  @Expose()
  addr1: string; // 주소
  @Expose()
  addr2: string; // 주소상세
  @Expose()
  tel: string; // 전화
  @Expose()
  homepage: string; // 홈페이지
  @Expose()
  resveUrl: string; // 예약 페이지
  @Expose()
  siteBottomCl1: string; // 잔디
  @Expose()
  siteBottomCl2: string; // 파쇄석
  @Expose()
  siteBottomCl3: string; // 테크
  @Expose()
  siteBottomCl4: string; // 자갈
  @Expose()
  siteBottomCl5: string; // 맨흙
  @Expose()
  operPdCl: string; // 운영기간
  @Expose()
  operDeCl: string; // 운영일
  @Expose()
  toiletCo: string; // 화장실 개수
  @Expose()
  swrmCo: string; // 샤워실 개수
  @Expose()
  wtrplCo: string; // 개수대 개수
  @Expose()
  sbrsCl: string; // 부대시설
  @Expose()
  firstImageUrl: string; // 대표이미지
  @Expose()
  animalCmgCl: string; // 애완동물 출입
  @Expose()
  eqpmnLendCl: string; // 캠핑장비 대여
  @Expose()
  posblFcltyCl: string; // 주변 이용가능시설
  @Expose()
  doNm: string;
  @Expose()
  sigunguNm: string;
}
