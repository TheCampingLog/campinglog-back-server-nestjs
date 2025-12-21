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
import { IsNull, Not, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ResponseGetReviewList } from './dto/response/response-get-review-list.dto';
import { ResponseGetBoardReviewRankList } from './dto/response/response-get-board-review-rank-list.dto';
import { InvalidLimitException } from './exceptions/invalid-limit.exception';
import { RequestAddReviewDto } from './dto/request/request-add-review.dto';
import { Member } from 'src/auth/entities/member.entity';
import { MemberNotFoundException } from 'src/member/exceptions/member-not-found.exception';
import { ReviewOfBoard } from './entities/review-of-board.entity';
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
    @InjectRepository(ReviewOfBoard)
    private readonly reviewOfBoardRepository: Repository<ReviewOfBoard>,
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
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

  async getBoardReviewRank(
    limit: number,
  ): Promise<ResponseGetBoardReviewRankList[]> {
    if (limit <= 0) {
      throw new InvalidLimitException(
        '리뷰 랭킹 조회 시 limit은 0보다 커야 합니다.',
      );
    }

    const reviews = await this.reviewOfBoardRepository.find({
      where: {
        reviewAverage: Not(IsNull()),
      },
      order: {
        reviewAverage: 'DESC',
        id: 'DESC',
      },
      take: limit,
    });

    const results: ResponseGetBoardReviewRankList[] = [];

    for (const review of reviews) {
      const rank: ResponseGetBoardReviewRankList = {
        reviewAverage: review.reviewAverage,
        mapY: review.mapY,
        mapX: review.mapX,
      };

      try {
        const detail = await this.getCampDetail(review.mapX, review.mapY);
        if (detail) {
          rank.doNm = detail.doNm;
          rank.sigunguNm = detail.sigunguNm;
          rank.firstImageUrl = detail.firstImageUrl;
          rank.facltNm = detail.facltNm;
        }
      } catch {
        // getCampDetail 실패 시 기본 정보만 반환
      }

      results.push(rank);
    }

    return results;
  }

  async addReview(dto: RequestAddReviewDto): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { email: dto.email },
    });

    if (!member) {
      throw new MemberNotFoundException(`회원 없음: email= ${dto.email}`);
    }

    const review = this.reviewRepository.create({
      mapX: dto.mapX,
      mapY: dto.mapY,
      reviewContent: dto.reviewContent,
      reviewScore: dto.reviewScore,
      reviewImage: dto.reviewImage,
      member,
    });

    await this.reviewRepository.save(review);

    // ReviewOfBoard 업데이트 또는 생성
    const existingReviewOfBoard = await this.reviewOfBoardRepository.findOne({
      where: { mapX: dto.mapX, mapY: dto.mapY },
    });

    if (existingReviewOfBoard) {
      const reviewCount = existingReviewOfBoard.reviewCount;
      existingReviewOfBoard.reviewCount = reviewCount + 1;
      existingReviewOfBoard.reviewAverage =
        (existingReviewOfBoard.reviewAverage * reviewCount + dto.reviewScore) /
        existingReviewOfBoard.reviewCount;
      await this.reviewOfBoardRepository.save(existingReviewOfBoard);
    } else {
      const newReviewOfBoard = this.reviewOfBoardRepository.create({
        reviewCount: 1,
        reviewAverage: dto.reviewScore,
        mapX: dto.mapX,
        mapY: dto.mapY,
      });
      await this.reviewOfBoardRepository.save(newReviewOfBoard);
    }
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
