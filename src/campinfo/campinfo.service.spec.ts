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

describe('CampinfoService', () => {
  let service: CampinfoService;
  let reviewRepository: Repository<Review>;
  let memberRepository: Repository<Member>;
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
          entities: [Member, Review, Board, Comment, BoardLike, RefreshToken],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Member, Review, Board, Comment, BoardLike]),
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
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  afterEach(async () => {
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
});
