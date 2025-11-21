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

  it('/api/boards (POST) success', async () => {
    // 1) 먼저 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'boardtest@example.com',
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

    // 2) 게시글 생성 DTO
    const testBoard = {
      title: '테스트 제목',
      content: '테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
      email: testUser.email,
    };

    return request(app.getHttpServer())
      .post('/api/boards')
      .send(testBoard)
      .expect(201)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', '게시글이 등록되었습니다.');
        expect(res.body).toHaveProperty('boardId');
      });
  });
});
