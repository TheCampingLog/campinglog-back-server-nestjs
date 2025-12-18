import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { ResponseGetCampWrapper } from './dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from './dto/response/response-get-camp-latest-list.dto';

import { AxiosResponse } from 'axios';
import { plainToInstance } from 'class-transformer';
import { ConfigService } from '@nestjs/config';
import { ResponseGetCampDetail } from './dto/response/response-get-camp-detail.dto';
import { MissingCampApiKeyException } from './exceptions/missing-camp-api-key.exception';
import { NoExistCampException } from './exceptions/no-exist-camp.exception';
import { ResponseGetCampByKeywordList } from './dto/response/response-get-camp-by-keyword-list.dto';
import { NoSearchResultException } from './exceptions/no-search-result.exception';
import { ResponseGetReviewListWrapper } from './dto/response/response-get-review-list-wrapper.dto';
import { Review } from './entities/review.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseGetReviewList } from './dto/response/response-get-review-list.dto';

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
        item: ResponseGetCampDetail;
      };
    };
  };
}

@Injectable()
export class CampinfoService {
  private readonly serviceKey: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly config: ConfigService,
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,
  ) {
    this.serviceKey = this.config.get<string>('CAMP_KEY') ?? '';
    if (!this.serviceKey) throw new MissingCampApiKeyException();
  }

  async getCampListLatest(
    pageNo: number,
    size: number,
  ): Promise<ResponseGetCampWrapper<ResponseGetCampLatestList>> {
    const params = {
      serviceKey: this.serviceKey,
      MobileOS: 'ETC',
      MobileApp: 'CampingLog',
      _type: 'json',
      pageNo,
      numOfRows: size,
    };

    const response: AxiosResponse<CampingApiResponse> =
      await this.httpService.axiosRef.get('/basedList', { params });

    const json = response.data;

    const total = this.parseTotalCount(json);
    const list = this.parseItems(json, ResponseGetCampLatestList);

    const totalPage = Math.ceil(total / size);

    const result: ResponseGetCampWrapper<ResponseGetCampLatestList> = {
      totalCount: total,
      items: list,
      totalPage,
      hasNext: pageNo < totalPage,
      page: pageNo,
      size,
    };
    return result;
  }

  async getCampDetail(
    mapX: string,
    mapY: string,
  ): Promise<ResponseGetCampDetail> {
    const params = {
      serviceKey: this.serviceKey,
      MobileOS: 'ETC',
      MobileApp: 'CampingLog',
      _type: 'json',
      pageNo: 1,
      numOfRows: 4,
      mapX: mapX,
      mapY: mapY,
      radius: 100,
    };

    const response: AxiosResponse<CampingApiResponse> =
      await this.httpService.axiosRef.get('/locationBasedList', { params });

    const json = response.data;

    const list = this.parseItems(json, ResponseGetCampDetail);
    if (list.length === 0) {
      throw new NoExistCampException('해당 게시글이 존재하지 않습니다.');
    }
    return list[0];
  }

  async getCampByKeyword(
    keyword: string,
    pageNo: number,
    size: number,
  ): Promise<ResponseGetCampWrapper<ResponseGetCampByKeywordList>> {
    const params = {
      serviceKey: this.serviceKey,
      MobileOS: 'ETC',
      MobileApp: 'CampingLog',
      _type: 'json',
      pageNo: pageNo,
      numOfRows: size,
      keyword: keyword,
    };

    const response: AxiosResponse<CampingApiResponse> =
      await this.httpService.axiosRef.get('/searchList', { params });

    const json = response.data;

    const total = this.parseTotalCount(json);
    const list = this.parseItems(json, ResponseGetCampByKeywordList);
    if (list.length === 0) {
      throw new NoSearchResultException(
        '검색 결과가 없습니다: keyword=' + keyword,
      );
    }
    const totalPage = Math.ceil(total / size);

    const result: ResponseGetCampWrapper<ResponseGetCampByKeywordList> = {
      totalCount: total,
      items: list,
      totalPage,
      hasNext: pageNo < totalPage,
      page: pageNo,
      size,
    };
    return result;
  }

  async getReviewList(
    mapX: string,
    mapY: string,
    page: number,
    size: number,
  ): Promise<ResponseGetReviewListWrapper> {
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: {
        mapX,
        mapY,
      },
      relations: ['member'],
      order: {
        createAt: 'DESC',
      },
      skip: (page - 1) * size,
      take: size,
    });
    const totalPages = Math.ceil(total / size);

    const items: ResponseGetReviewList[] = reviews.map((review) => ({
      reviewImage: review.reviewImage,
      reviewContent: review.reviewContent,
      reviewScore: review.reviewScore,
      email: review.member.email,
      nickname: review.member.nickname,
      createAt: review.createAt,
      updateAt: review.updateAt,
    }));

    return {
      items,
      page,
      size,
      hasNext: page + 1 < totalPages,
      totalElement: total,
      totalPages,
    };
  }

  parseItems<T>(json: CampingApiResponse, type: new () => T): T[] {
    const items = json?.response?.body?.items?.item;

    if (!items) return [];

    const result: T[] = [];
    if (Array.isArray(items)) {
      items.map((item) =>
        result.push(
          plainToInstance(type, item, { excludeExtraneousValues: true }),
        ),
      );
    } else if (typeof items === 'object') {
      result.push(
        plainToInstance(type, items, { excludeExtraneousValues: true }),
      );
    }
    return result;
  }

  parseTotalCount(json: CampingApiResponse): number {
    return json?.response?.body?.totalCount ?? 0;
  }
}
