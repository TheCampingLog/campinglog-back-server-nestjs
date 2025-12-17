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

describe('AppController (e2e)', () => {
  let app: INestApplication<App>;

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
});
