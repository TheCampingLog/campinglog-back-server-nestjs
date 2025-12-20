import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseGetCampWrapper } from 'src/campinfo/dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from 'src/campinfo/dto/response/response-get-camp-latest-list.dto';
import { ResponseGetCampDetail } from 'src/campinfo/dto/response/response-get-camp-detail.dto';
import { ResponseGetCampByKeywordList } from 'src/campinfo/dto/response/response-get-camp-by-keyword-list.dto';
import { Repository } from 'typeorm';
import { Review } from 'src/campinfo/entities/review.entity';
import { Member } from 'src/auth/entities/member.entity';
import { ResponseGetReviewListWrapper } from 'src/campinfo/dto/response/response-get-review-list-wrapper.dto';
import { RequestAddMemberDto } from 'src/auth/dto/request/request-add-member.dto';
import { ReviewOfBoard } from 'src/campinfo/entities/review-of-board.entity';

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let reviewRepository: Repository<Review>;
  let memberRepository: Repository<Member>;
  let reviewOfBoardRepository: Repository<ReviewOfBoard>;
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
      }),
    );

    await app.init();
    reviewRepository = moduleFixture.get('ReviewRepository');
    memberRepository = moduleFixture.get('MemberRepository');
    reviewOfBoardRepository = moduleFixture.get('ReviewOfBoardRepository');
  });

  it('/api/camps/list (GET) 200', () => {
    const testValue = {
      number: 1,
      size: 4,
    };

    return request(app.getHttpServer())
      .get('/api/camps/list')
      .query(testValue)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('totalCount');
        expect(res.body).toHaveProperty('items');
        expect(
          (res.body as ResponseGetCampWrapper<ResponseGetCampLatestList>).items
            .length,
        ).toBeGreaterThan(0);
        expect(res.body).toHaveProperty('totalPage');
        expect(res.body).toHaveProperty('hasNext');
        expect(res.body).toHaveProperty('page');
        expect(res.body).toHaveProperty('size');
      });
  });

  it('/api/camps/detail/:mapX/:mapY (GET) 200', async () => {
    const mapX = '127.2636514';
    const mapY = '37.0323408';

    const res = await request(app.getHttpServer())
      .get(`/api/camps/detail/${mapX}/${mapY}`)
      .expect(200);
    const result = res.body as ResponseGetCampDetail;
    expect(result).toBeDefined();
    expect(result.facltNm).toBeDefined();
  });

  it('/api/camps/detail/:mapX/:mapY (GET) 404', async () => {
    const mapX = '9999';
    const mapY = '9999';

    await request(app.getHttpServer())
      .get(`/api/camps/detail/${mapX}/${mapY}`)
      .expect(404);
  });

  it('/api/camps/keyword (GET) 200', async () => {
    const testValue = {
      keyword: '야영장',
      pageNo: 1,
      size: 4,
    };

    await request(app.getHttpServer())
      .get('/api/camps/keyword')
      .query(testValue)
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          items: ResponseGetCampByKeywordList;
          page: number;
          size: number;
          totalCount: number;
          totalPage: number;
          hasNext: boolean;
        };
        expect(body).toHaveProperty('items');
        expect(body).toHaveProperty('totalCount');
        expect(body).toHaveProperty('totalPage');
        expect(body).toHaveProperty('page');
        expect(body).toHaveProperty('size');
        expect(body).toHaveProperty('hasNext');
      });
  });

  it('/api/camps/keyword (GET) 404', async () => {
    const testValue = {
      keyword: '헬스',
      pageNo: 1,
      size: 4,
    };

    await request(app.getHttpServer())
      .get('/api/camps/keyword')
      .query(testValue)
      .expect(404);
  });

  it('/api/camps/reviews/{mapX}/{mapY} (GET) 200', async () => {
    const mapX = '129.634822811708';
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
      mapX,
      mapY,
      reviewContent: '테스트 리뷰',
      reviewScore: 4.0,
      member,
    });

    const res = await request(app.getHttpServer())
      .get(`/api/camps/reviews/${mapX}/${mapY}`)
      .query({ pageNo: 0, size: 4 })
      .expect(200);
    const result = res.body as ResponseGetReviewListWrapper;

    expect(result.items).toHaveLength(1);
    expect(result.items[0].reviewContent).toBe('테스트 리뷰');
  });

  it('/api/camps/reviews/{mapX}/{mapY} (GET) 200 리뷰 없음', async () => {
    const mapX = '0';
    const mapY = '0';

    const res = await request(app.getHttpServer())
      .get(`/api/camps/reviews/${mapX}/${mapY}`)
      .query({ pageNo: 0, size: 4 })
      .expect(200);
    const result = res.body as ResponseGetReviewListWrapper;
    expect(result.items).toHaveLength(0);
    expect(result.totalElement).toBe(0);
  });

  it('/api/camps/reviews/board/rank (GET) 200 - 성공', async () => {
    const testValue = {
      limit: 3,
    };

    await request(app.getHttpServer())
      .get('/api/camps/reviews/board/rank')
      .query(testValue)
      .expect(200)
      .expect((res) => {
        const body = res.body as Array<{
          reviewAverage: number;
          mapX: string;
          mapY: string;
        }>;
        expect(Array.isArray(body)).toBe(true);
        // 결과가 있다면 구조 검증
        if (body.length > 0) {
          expect(body[0]).toHaveProperty('reviewAverage');
          expect(body[0]).toHaveProperty('mapX');
          expect(body[0]).toHaveProperty('mapY');
        }
      });
  });

  it('/api/camps/reviews/board/rank (GET) 200 - 기본값 limit=3', async () => {
    await request(app.getHttpServer())
      .get('/api/camps/reviews/board/rank')
      .expect(200)
      .expect((res) => {
        const body = res.body as unknown[];
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeLessThanOrEqual(3);
      });
  });

  it('/api/camps/reviews/board/rank (GET) 400 - limit이 0 이하', async () => {
    const testValue = {
      limit: 0,
    };

    await request(app.getHttpServer())
      .get('/api/camps/reviews/board/rank')
      .query(testValue)
      .expect(400)
      .expect((res) => {
        const body = res.body as { message: string };
        expect(body.message).toContain(
          '리뷰 랭킹 조회 시 limit은 0보다 커야 합니다.',
        );
      });
  });

  it('/api/camps/members/reviews (PUT) 204', async () => {
    const mapX = '129.634822811708';
    const mapY = '36.8780509365952';

    const testUser: RequestAddMemberDto = {
      email: 'test@example.com',
      password: 'test1234',
      name: 'tester',
      nickname: 'nick',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-5678',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    const validMember = {
      email: testUser.email,
      password: testUser.password,
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];

    const review1 = await reviewRepository.save({
      mapX,
      mapY,
      reviewContent: '리뷰1',
      reviewScore: 2.0,
      member: { email: validMember.email } as Member,
    });

    await reviewOfBoardRepository.save({
      mapX,
      mapY,
      reviewCount: 1,
      reviewAverage: 2.0,
    });

    await request(app.getHttpServer())
      .put('/api/camps/members/reviews')
      .set('authorization', accessToken)
      .send({
        mapX,
        mapY,
        id: review1.id,
        newReviewContent: '수정된 리뷰',
        newReviewScore: 4.0,
        newReviewImage: null,
      })
      .expect(204);
  });
});
