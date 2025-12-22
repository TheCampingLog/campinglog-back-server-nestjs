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
import { RequestRemoveReviewDto } from './dto/request/request-remove-review.dto';
import { Member } from 'src/auth/entities/member.entity';
import { MemberNotFoundException } from 'src/member/exceptions/member-not-found.exception';
import { ReviewOfBoard } from './entities/review-of-board.entity';
import { CallCampApiException } from './exceptions/call-camp-api.exception';
import { ResponseGetMyReviewList } from './dto/response/response-get-my-review-list.dto';
import { ResponseGetMyReviewWrapper } from './dto/response/response-get-my-review-rapper.dto';
import { ResponseGetBoardReview } from './dto/response/response-get-board-review.dto';
import { RequestSetReview } from './dto/request/request-set-review.dto';
import { NullReviewException } from './exceptions/null-review.exception';

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

  async removeReview(dto: RequestRemoveReviewDto): Promise<void> {
    const deleteReview = await this.reviewRepository.findOne({
      where: { id: dto.id },
    });

    if (!deleteReview) {
      throw new NullReviewException(`삭제할 리뷰 없음: id = ${dto.id}`);
    }

    await this.reviewRepository.delete(dto.id);

    const reviewOfBoard = await this.reviewOfBoardRepository.findOne({
      where: { mapX: deleteReview.mapX, mapY: deleteReview.mapY },
    });

    if (reviewOfBoard) {
      // reviewCount가 1이면 마지막 리뷰이므로 ReviewOfBoard 삭제
      if (reviewOfBoard.reviewCount === 1) {
        await this.reviewOfBoardRepository.delete({
          mapX: deleteReview.mapX,
          mapY: deleteReview.mapY,
        });
      } else {
        // reviewCount > 1이면 평균 재계산 후 저장
        reviewOfBoard.reviewAverage =
          (reviewOfBoard.reviewAverage * reviewOfBoard.reviewCount -
            deleteReview.reviewScore) /
          (reviewOfBoard.reviewCount - 1);
        reviewOfBoard.reviewCount = reviewOfBoard.reviewCount - 1;
        await this.reviewOfBoardRepository.save(reviewOfBoard);

        // reviewCount가 0이 되면 삭제
        const checkReviewOfBoard = await this.reviewOfBoardRepository.findOne({
          where: { mapX: deleteReview.mapX, mapY: deleteReview.mapY },
        });
        if (checkReviewOfBoard && checkReviewOfBoard.reviewCount === 0) {
          await this.reviewOfBoardRepository.delete({
            mapX: deleteReview.mapX,
            mapY: deleteReview.mapY,
          });
        }
      }
    }
  }

  async getBoardReview(
    mapX: string,
    mapY: string,
  ): Promise<ResponseGetBoardReview> {
    const reviewOfBoard = await this.reviewOfBoardRepository.findOne({
      where: { mapX, mapY },
    });

    if (!reviewOfBoard) {
      return {
        reviewAverage: 0.0,
        reviewCount: 0,
      };
    }

    return {
      reviewAverage: reviewOfBoard.reviewAverage,
      reviewCount: reviewOfBoard.reviewCount,
    };
  }

  async getMyReviews(
    email: string,
    pageNo: number,
    size: number,
  ): Promise<ResponseGetMyReviewWrapper> {
    const page = pageNo - 1;
    const skip = page * size;
    const take = size;

    // 1. 리뷰 목록 조회 (페이징)
    const [reviews, total] = await this.reviewRepository.findAndCount({
      where: {
        member: {
          email,
        },
      },
      order: {
        createAt: 'DESC',
      },
      skip,
      take,
    });

    // 2. 캠핑장 상세 비동기 조회 (병렬)
    const reviewList: ResponseGetMyReviewList[] = await Promise.all(
      reviews.map(async (review) => {
        try {
          const detail = await this.getCampDetail(review.mapX, review.mapY);

          return {
            id: review.id,
            reviewScore: review.reviewScore,
            reviewContent: review.reviewContent,
            mapX: review.mapX,
            mapY: review.mapY,
            createAt: review.createAt,
            facltNm: detail?.facltNm ?? null,
            firstImageUrl: detail?.firstImageUrl ?? null,
          };
        } catch {
          throw new CallCampApiException(review.mapX, review.mapY);
        }
      }),
    );

    // 3. 응답 래퍼 구성
    return {
      content: reviewList,
      page,
      size,
      totalElements: total,
      totalPage: Math.ceil(total / size),
      hasNext: skip + take < total,
    };
  }

  async setReview(
    email: string,
    requestSetReview: RequestSetReview,
  ): Promise<void> {
    const member = await this.memberRepository.findOneBy({ email });
    if (!member) {
      throw new MemberNotFoundException(email);
    }

    const { id, newReviewContent, newReviewScore, newReviewImage } =
      requestSetReview;

    const review = await this.reviewRepository.findOne({
      where: { id },
    });

    if (!review) {
      throw new NullReviewException(`리뷰 없음: id=${id}`);
    }

    let updated = false;

    if (review.reviewContent !== newReviewContent) {
      review.reviewContent = newReviewContent;
      updated = true;
    }

    if (review.reviewScore !== newReviewScore) {
      const oldScore = review.reviewScore;
      review.reviewScore = newReviewScore;
      updated = true;

      const reviewOfBoard = await this.reviewOfBoardRepository.findOne({
        where: { mapX: review.mapX, mapY: review.mapY },
      });

      if (reviewOfBoard) {
        reviewOfBoard.reviewAverage =
          (reviewOfBoard.reviewAverage * reviewOfBoard.reviewCount +
            (newReviewScore - oldScore)) /
          reviewOfBoard.reviewCount;

        await this.reviewOfBoardRepository.save(reviewOfBoard);
      }
    }

    if (review.reviewImage !== newReviewImage) {
      review.reviewImage = newReviewImage;
      updated = true;
    }

    if (updated) {
      await this.reviewRepository.save(review);
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
