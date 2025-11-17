import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RequestAddMemeberDto } from 'src/auth/dto/request/request-add-member.dto';
import { ValidationPipe } from '@nestjs/common';

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

  it('/api/members (POST) success', () => {
    //given
    const testUser: RequestAddMemeberDto = {
      email: 'test@example.com',
      password: 'test1234',
      name: 'choi',
      nickname: 'test',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-1234',
    };

    return request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201)
      .expect({ message: 'success' });
  });
  it('/api/members (POST) validation fail', () => {
    //given
    const invalidName = 'choi'.repeat(30);
    const testUser: RequestAddMemeberDto = {
      email: 'test@example.com',
      password: 'test1234',
      name: invalidName,
      nickname: 'test',
      birthday: '2000-06-12',
      phoneNumber: '010-1234-1234',
    };

    return request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(400);
  });
});
