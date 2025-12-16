import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { ResponseGetCampWrapper } from 'src/campinfo/dto/response/response-get-camp-wrapper.dto';
import { ResponseGetCampLatestList } from 'src/campinfo/dto/response/response-get-camp-latest-list.dto';

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
    //given
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

    expect(res.body).toBeDefined();
    expect(res.body.facltNm).toBeDefined();
  });

  it('/api/camps/detail/:mapX/:mapY (GET) 404', async () => {
    const mapX = '9999';
    const mapY = '9999';

    await request(app.getHttpServer())
      .get(`/api/camps/detail/${mapX}/${mapY}`)
      .expect(404)
      .expect((res) => {
        expect(res.body.message).toContain('해당 게시글이 존재하지 않습니다.');
      });
  });
});
