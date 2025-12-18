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

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;
  let reviewRepository: Repository<Review>;
  let memberRepository: Repository<Member>;
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
});
