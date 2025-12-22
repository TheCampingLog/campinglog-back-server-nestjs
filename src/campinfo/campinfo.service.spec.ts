import { Test, TestingModule } from '@nestjs/testing';
import { CampinfoService } from './campinfo.service';
import { ConfigModule } from '@nestjs/config';
import { HttpConfigModule } from '../config/http-config.module';
import { ResponseGetCampByKeywordList } from './dto/response/response-get-camp-by-keyword-list.dto';
import { NoSearchResultException } from './exceptions/no-search-result.exception';
import { NoExistCampException } from './exceptions/no-exist-camp.exception';
import { Repository } from 'typeorm';
import { Review } from './entities/review.entity';
import { getRepositoryToken, TypeOrmModule } from '@nestjs/typeorm';
import { Member } from 'src/auth/entities/member.entity';
import { Board } from 'src/board/entities/board.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import { Comment } from 'src/board/entities/comment.entity';
import { ReviewOfBoard } from './entities/review-of-board.entity';
import { InvalidLimitException } from './exceptions/invalid-limit.exception';

describe('CampinfoService', () => {
  let service: CampinfoService;
  let reviewRepository: Repository<Review>;
  let memberRepository: Repository<Member>;
  let reviewOfBoardRepository: Repository<ReviewOfBoard>;
  let module: TestingModule | null = null;
  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'src/config/env/.dev.env',
        }),
        HttpConfigModule,
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [
            Member,
            Review,
            Board,
            Comment,
            BoardLike,
            RefreshToken,
            ReviewOfBoard,
          ],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([
          Member,
          Review,
          Board,
          Comment,
          BoardLike,
          ReviewOfBoard,
        ]),
      ],
      providers: [CampinfoService],
    }).compile();

    service = module.get<CampinfoService>(CampinfoService);
    reviewRepository = module.get<Repository<Review>>(
      getRepositoryToken(Review),
    );
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
    reviewOfBoardRepository = module.get<Repository<ReviewOfBoard>>(
      getRepositoryToken(ReviewOfBoard),
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  afterEach(async () => {
    await reviewOfBoardRepository.clear();
    await reviewRepository.clear();
    await memberRepository.clear();
  });
  it('캠핑장 목록 조회 테스트', async () => {
    //given
    const pageNo = 1;
    const size = 4;
    //when
    const result = await service.getCampListLatest(pageNo, size);
    //then
    expect(result.items.length).toBeGreaterThan(0);
  });

  it('캠핑장 상세 조회 테스트', async () => {
    //given
    const mapX = '127.2636514';
    const mapY = '37.0323408';
    //when
    const result = await service.getCampDetail(mapX, mapY);
    //then
    expect(result).not.toBeNull();
    expect(result.facltNm).toBeDefined();
  });

  it('캠핑장 상세 없는 게시물 조회 테스트', async () => {
    //given
    const mapX = '127.263651312312123412312312312331223';
    const mapY = '37.0323408213123123123123';
    //when & then
    await expect(service.getCampDetail(mapX, mapY)).rejects.toThrow(
      NoExistCampException,
    );
  });

  it('캠핑장 키워드 검색 목록 조회 테스트', async () => {
    //given
    const pageNo = 1;
    const size = 4;
    const keyword = '야영장';
    //when & then
    const result: ResponseGetCampByKeywordList[] = (
      await service.getCampByKeyword(keyword, pageNo, size)
    ).items;
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].facltNm).toContain('야영장');
  });

  it('캠핑장 키워드 검색 없는 목록 조회 테스트', async () => {
    //given
    const pageNo = 1;
    const size = 4;
    const keyword = '헬스';
    //when & then
    await expect(
      service.getCampByKeyword(keyword, pageNo, size),
    ).rejects.toThrow(NoSearchResultException);
  });

  it('캠핑장 리뷰 목록 조회 테스트', async () => {
    //given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    await reviewRepository.save({
      mapX: '127.634822811708',
      mapY: '36.8780509365952',
      reviewContent: '테스트 리뷰',
      reviewScore: 4.0,
      member: member,
    });

    const mapX = '127.634822811708';
    const mapY = '36.8780509365952';
    const page = 1;
    const size = 4;
    //when & then
    const result = await service.getReviewList(mapX, mapY, page, size);
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items).toHaveLength(1);
  });

  it('인기상승 캠핑장 리뷰 조회 - 성공', async () => {
    //given
    const limit = 3;

    // 실제 존재하는 서로 다른 캠핑장 좌표로 테스트 데이터 생성
    await reviewOfBoardRepository.save([
      {
        reviewAverage: 4.5,
        reviewCount: 10,
        mapX: '127.2636514', // 실제 캠핑장 좌표 1
        mapY: '37.0323408',
      },
      {
        reviewAverage: 4.3,
        reviewCount: 8,
        mapX: '127.3636514', // 다른 좌표
        mapY: '37.1323408',
      },
      {
        reviewAverage: 4.1,
        reviewCount: 5,
        mapX: '127.4636514', // 다른 좌표
        mapY: '37.2323408',
      },
    ]);

    //when
    const result = await service.getBoardReviewRank(limit);

    //then
    expect(result).toBeDefined();
    expect(result.length).toBe(3);
    expect(result[0].reviewAverage).toBe(4.5);
    expect(result[0].mapX).toBe('127.2636514');
    expect(result[0].mapY).toBe('37.0323408');
    // reviewAverage 내림차순 정렬 확인
    expect(result[0].reviewAverage).toBeGreaterThan(result[1].reviewAverage);
    expect(result[1].reviewAverage).toBeGreaterThan(result[2].reviewAverage);
  });

  it('인기상승 캠핑장 리뷰 조회 - limit이 0 이하인 경우 에러', async () => {
    //given
    const limit = 0;

    //when & then
    await expect(service.getBoardReviewRank(limit)).rejects.toThrow(
      InvalidLimitException,
    );
    await expect(service.getBoardReviewRank(limit)).rejects.toThrow(
      '리뷰 랭킹 조회 시 limit은 0보다 커야 합니다.',
    );
  });

  it('인기상승 캠핑장 리뷰 조회 - 빈 결과', async () => {
    //given
    const limit = 3;
    // DB에 데이터 없음

    //when
    const result = await service.getBoardReviewRank(limit);

    //then
    expect(result).toBeDefined();
    expect(result.length).toBe(0);
  });

  it('리뷰 추가 테스트 - 첫 번째 리뷰 (ReviewOfBoard 생성)', async () => {
    //given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const dto = {
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '정말 좋은 캠핑장입니다!',
      reviewScore: 5,
      reviewImage: 'image.jpg',
      email: member.email,
    };

    //when
    await service.addReview(dto);

    //then
    const savedReview = await reviewRepository.findOne({
      where: { mapX: dto.mapX, mapY: dto.mapY },
      relations: ['member'],
    });
    expect(savedReview).toBeDefined();
    expect(savedReview!.reviewContent).toBe(dto.reviewContent);
    expect(savedReview!.reviewScore).toBe(dto.reviewScore);
    expect(savedReview!.member.email).toBe(member.email);

    const reviewOfBoard = await reviewOfBoardRepository.findOne({
      where: { mapX: dto.mapX, mapY: dto.mapY },
    });
    expect(reviewOfBoard).toBeDefined();
    expect(reviewOfBoard!.reviewCount).toBe(1);
    expect(reviewOfBoard!.reviewAverage).toBe(5);
  });

  it('리뷰 추가 테스트 - 두 번째 리뷰 (ReviewOfBoard 업데이트)', async () => {
    //given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const member2 = memberRepository.create({
      email: 'test2@example.com',
      password: 'password123',
      name: '김철수',
      nickname: 'tester2',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5679',
    });
    await memberRepository.save(member2);

    // 첫 번째 리뷰 추가
    await service.addReview({
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '첫 번째 리뷰',
      reviewScore: 3,
      email: member.email,
    });

    // 두 번째 리뷰 추가
    const dto = {
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '두 번째 리뷰',
      reviewScore: 5,
      email: member2.email,
    };

    //when
    await service.addReview(dto);

    //then
    const reviewCount = await reviewRepository.count({
      where: { mapX: dto.mapX, mapY: dto.mapY },
    });
    expect(reviewCount).toBe(2);

    const reviewOfBoard = await reviewOfBoardRepository.findOne({
      where: { mapX: dto.mapX, mapY: dto.mapY },
    });
    expect(reviewOfBoard).toBeDefined();
    expect(reviewOfBoard!.reviewCount).toBe(2);
    expect(reviewOfBoard!.reviewAverage).toBe(4);
  });

  it('리뷰 추가 테스트 - 회원 없음 에러', async () => {
    //given
    const dto = {
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '테스트 리뷰',
      reviewScore: 4,
      email: 'nonexistent@example.com',
    };

    //when & then
    await expect(service.addReview(dto)).rejects.toThrow(
      '회원 없음: email= nonexistent@example.com',
    );
  });

  it('리뷰 삭제 테스트 - ReviewOfBoard 업데이트 (count > 1)', async () => {
    //given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    // 첫 번째 리뷰 추가
    await service.addReview({
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '첫 번째 리뷰',
      reviewScore: 3,
      email: member.email,
    });

    // 두 번째 리뷰 추가
    await service.addReview({
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '두 번째 리뷰',
      reviewScore: 5,
      email: member.email,
    });

    const reviews = await reviewRepository.find({
      where: { mapX: '127.2636514', mapY: '37.0323408' },
    });
    const firstReviewId = reviews[0].id;

    //when - 첫 번째 리뷰 삭제
    await service.removeReview({ id: firstReviewId });

    //then
    const deletedReview = await reviewRepository.findOne({
      where: { id: firstReviewId },
    });
    expect(deletedReview).toBeNull();

    const remainingReviews = await reviewRepository.find({
      where: { mapX: '127.2636514', mapY: '37.0323408' },
    });
    expect(remainingReviews.length).toBe(1);

    const reviewOfBoard = await reviewOfBoardRepository.findOne({
      where: { mapX: '127.2636514', mapY: '37.0323408' },
    });
    expect(reviewOfBoard).toBeDefined();
    expect(reviewOfBoard!.reviewCount).toBe(1);
    // (4 * 2 - 3) / 1 = 5
    expect(reviewOfBoard!.reviewAverage).toBe(5);
  });

  it('리뷰 삭제 테스트 - 마지막 리뷰 (ReviewOfBoard 삭제)', async () => {
    //given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    // 리뷰 추가
    await service.addReview({
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '유일한 리뷰',
      reviewScore: 4,
      email: member.email,
    });

    const review = await reviewRepository.findOne({
      where: { mapX: '127.2636514', mapY: '37.0323408' },
    });

    //when - 유일한 리뷰 삭제
    await service.removeReview({ id: review!.id });

    //then
    const deletedReview = await reviewRepository.findOne({
      where: { id: review!.id },
    });
    expect(deletedReview).toBeNull();

    const reviewOfBoard = await reviewOfBoardRepository.findOne({
      where: { mapX: '127.2636514', mapY: '37.0323408' },
    });
    expect(reviewOfBoard).toBeNull();
  });

  it('리뷰 삭제 테스트 - 리뷰 없음 에러', async () => {
    //given
    const dto = {
      id: 99999,
    };

    //when & then
    await expect(service.removeReview(dto)).rejects.toThrow(
      '삭제할 리뷰 없음: id = 99999',
    );
  });

  it('게시판 리뷰 정보 조회', async () => {
    //given
    const mapX = '127.634822811708';
    const mapY = '36.8780509365952';

    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    await reviewRepository.save({
      mapX: '127.634822811708',
      mapY: '36.8780509365952',
      reviewContent: '테스트 리뷰',
      reviewScore: 4.0,
      member: member,
    });

    let reviewOfBoard = await reviewOfBoardRepository.findOne({
      where: { mapX, mapY },
    });

    if (!reviewOfBoard) {
      reviewOfBoard = reviewOfBoardRepository.create({
        mapX,
        mapY,
        reviewCount: 1,
        reviewAverage: 4.0,
      });
    }
    await reviewOfBoardRepository.save(reviewOfBoard);
    //when
    const result = await service.getBoardReview(mapX, mapY);
    //then
    expect(result.reviewCount).toBe(1);
  });

  it('게시판 리뷰 정보 조회(리뷰 없음)', async () => {
    //given
    const mapX = '127.634822811708';
    const mapY = '36.8780509365952';
    //when
    const result = await service.getBoardReview(mapX, mapY);
    //then
    expect(result.reviewCount).toBe(0);
  });

  it('내 리뷰 목록 불러오기', async () => {
    //given
    const mapX = '127.634822811708';
    const mapY = '36.8780509365952';
    const email = 'test@example.com';
    const member = memberRepository.create({
      email,
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    await reviewRepository.save({
      mapX,
      mapY,
      reviewContent: '리뷰1',
      reviewScore: 2.0,
      member,
    });

    await reviewRepository.save({
      mapX,
      mapY,
      reviewContent: '리뷰2',
      reviewScore: 3.0,
      member,
    });

    await reviewRepository.save({
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '리뷰3',
      reviewScore: 4.0,
      member,
    });

    await reviewOfBoardRepository.save({
      mapX,
      mapY,
      reviewCount: 3,
      reviewAverage: 6.0,
    });

    const result = await service.getMyReviews(email, 1, 4);

    expect(result.content.length).toBe(3);
  });
});
