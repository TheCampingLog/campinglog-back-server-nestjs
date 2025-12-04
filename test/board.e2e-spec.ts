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

  it('/api/boards/:boardId (PUT) success', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'boardupdate@example.com',
      password: 'test1234',
      name: 'updater',
      nickname: 'updateNick',
      birthday: '2000-06-21',
      phoneNumber: '010-9999-8888',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 게시글 생성
    const createBoardDto = {
      title: '원래 제목',
      content: '원래 내용',
      categoryName: 'FREE',
      boardImage: null,
      email: testUser.email,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .send(createBoardDto)
      .expect(201);

    const { boardId } = createRes.body as BoardResponse;

    expect(boardId).toBeDefined();

    // 3) 게시글 수정 DTO
    const updateBoardDto = {
      title: '수정된 제목',
      content: '수정된 내용',
      categoryName: 'NOTICE',
      boardImage: 'updated-image',
      email: testUser.email,
    };

    // 4) PUT /api/boards/:boardId 호출
    return request(app.getHttpServer())
      .put(`/api/boards/${boardId}`)
      .send(updateBoardDto)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', '게시글이 수정되었습니다.');
      });
  });

  it('/api/boards/:boardId (DELETE) success', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'boarddelete@example.com',
      password: 'test1234',
      name: 'deleter',
      nickname: 'deleteNick',
      birthday: '2000-06-21',
      phoneNumber: '010-7777-6666',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 게시글 생성
    const createBoardDto = {
      title: '삭제할 제목',
      content: '삭제할 내용',
      categoryName: 'FREE',
      boardImage: null,
      email: testUser.email,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .send(createBoardDto)
      .expect(201);

    const { boardId } = createRes.body as BoardResponse;

    expect(boardId).toBeDefined();

    // 3) DELETE /api/boards/:boardId 호출
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}`)
      .expect(200);
  });
});
