import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ResponseGetCampWrapper } from './dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from './dto/response/response-get-camp-latest-list.dto';

import { AxiosResponse } from 'axios';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';

// 예상 응답 타입 인터페이스 예시
interface CampingApiResponse {
  response: {
    header: {
      resultMsg: string;
      resultCode: string;
    };
    body: {
      numOfRows: number;
      pageNo: number;
      totalCount: number;
      items: {
        item: {
          facltNm: string; // 야영장명
          lineIntro: string; // 한줄소개
          intro: string; // 소개
          hvofBgnde: string; // 휴장기간 휴무기간 시작일
          hvofEnddle: string; // 휴장기간 휴무기간 종료일
          featureNm: string; // 특징
          induty: string; // 업종
          lctCl: string; // 입지구분
          addr1: string; // 주소
          addr2: string; // 주소상세
          tel: string; // 전화
          homepage: string; // 홈페이지
          resveUrl: string; // 예약 페이지
          siteBottomCl1: string; // 잔디
          siteBottomCl2: string; // 파쇄석
          siteBottomCl3: string; // 테크
          siteBottomCl4: string; // 자갈
          siteBottomCl5: string; // 맨흙
          operPdCl: string; // 운영기간
          operDeCl: string; // 운영일
          toiletCo: string; // 화장실 개수
          swrmCo: string; // 샤워실 개수
          wtrplCo: string; // 개수대 개수
          sbrsCl: string; // 부대시설
          firstImageUrl: string; // 대표이미지
          animalCmgCl: string; // 애완동물 출입
          eqpmnLendCl: string; // 캠핑장비 대여
          posblFcltyCl: string; // 주변 이용가능시설
          doNm: string;
          sigunguNm: string;
        };
      };
    };
  };
}

@Injectable()
export class CampinfoService {
  private readonly serviceKey: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService
  ) {
    this.serviceKey = this.config.get<string>('CAMP_KEY') ?? '';
    if (!this.serviceKey) throw new Error('환경변수 CAMP_KEY MISSING 에러');
  }

  async getCampListLatest(
    pageNo: number,
    size: number
  ): Promise<ResponseGetCampWrapper<ResponseGetCampLatestList>> {
    try {
      const params = {
        serviceKey: this.serviceKey,
        MobileOS: 'ETC',
        MobileApp: 'CampingLog',
        _type: 'json',
        pageNo,
        numOfRows: size
      };

      const response: AxiosResponse<CampingApiResponse> =
        await this.httpService.axiosRef.get('/basedList', { params });

      const json = response.data;
      if (!json?.response?.body) {
        throw new Error('GoCamping API 응답 구조가 올바르지 않습니다.');
      }

      const total = this.parseTotalCount(json);
      const list = this.parseItems(json, ResponseGetCampLatestList);

      const totalPage = Math.ceil(total / size);

      const result: ResponseGetCampWrapper<ResponseGetCampLatestList> = {
        totalCount: total,
        items: list,
        totalPage,
        hasNext: pageNo < totalPage,
        page: pageNo,
        size
      };
      return result;
    } catch (e) {
      const message = e instanceof Error ? e.message : JSON.stringify(e);
      throw new Error(`getCampListLatest 서비스 오류: ${message}`);
    }
  }

  parseItems<T>(json: CampingApiResponse, type: new () => T): T[] {
    try {
      const items = json.response.body?.items?.item;

      if (!items) return [];

      const result: T[] = [];
      if (Array.isArray(items)) {
        items.map((item) =>
          result.push(
            plainToInstance(type, item, { excludeExtraneousValues: true })
          )
        );
      } else if (typeof items === 'object') {
        result.push(
          plainToInstance(type, items, { excludeExtraneousValues: true })
        );
      }
      return result;
    } catch (e) {
      if (e instanceof Error) {
        throw new Error('GoCamping items 파싱 실패: ' + e.message);
      } else {
        throw new Error('GoCamping items 파싱 실패: 알 수 없는 에러');
      }
    }
  }

  parseTotalCount(json: CampingApiResponse): number {
    try {
      return json.response.body.totalCount ?? 0;
    } catch (e) {
      if (e instanceof Error) {
        throw new Error('GoCamping totalCount 파싱 실패: ' + e.message);
      } else {
        throw new Error('GoCamping totalCount 파싱 실패: 알 수 없는 에러');
      }
    }
  }
}
