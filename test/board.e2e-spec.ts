import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RequestAddMemeberDto } from 'src/auth/dto/request/request-add-member.dto';
import { ValidationPipe } from '@nestjs/common';

describe('BoardController (e2e)', () => {
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

  it('/api/boards/rank (GET) success', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'ranktest@example.com',
      password: 'test1234',
      name: 'ranker',
      nickname: 'rankNick',
      birthday: '2000-06-21',
      phoneNumber: '010-7777-8888',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 여러 게시글 생성
    const board1 = {
      title: '인기 게시글 1',
      content: '내용1',
      categoryName: 'FREE',
      email: testUser.email,
    };

    const board2 = {
      title: '인기 게시글 2',
      content: '내용2',
      categoryName: 'FREE',
      email: testUser.email,
    };

    await request(app.getHttpServer()).post('/api/boards').send(board1);
    await request(app.getHttpServer()).post('/api/boards').send(board2);

    // 3) GET /api/boards/rank?limit=2 호출
    return request(app.getHttpServer())
      .get('/api/boards/rank?limit=2')
      .expect(200)
      .expect((res) => {
        const body = res.body as Array<{
          boardId: string;
          title: string;
          nickname: string;
          rank: number;
          viewCount: number;
          boardImage: string | null;
        }>;

        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeLessThanOrEqual(2);

        if (body.length > 0) {
          expect(body[0]).toHaveProperty('boardId');
          expect(body[0]).toHaveProperty('title');
          expect(body[0]).toHaveProperty('nickname');
          expect(body[0]).toHaveProperty('rank');
          expect(body[0]).toHaveProperty('viewCount');
          expect(body[0]).toHaveProperty('boardImage');
        }
      });
  });

  it('/api/boards/rank (GET) default limit', async () => {
    // limit 파라미터 없이 호출하면 기본값 3 적용
    return request(app.getHttpServer())
      .get('/api/boards/rank')
      .expect(200)
      .expect((res) => {
        const body = res.body as unknown[];
        expect(Array.isArray(body)).toBe(true);
        expect(body.length).toBeLessThanOrEqual(3);
      });
  });

  it('/api/boards/rank (GET) invalid limit', async () => {
    // limit가 1 미만이면 400 에러
    return request(app.getHttpServer())
      .get('/api/boards/rank?limit=0')
      .expect(400)
      .expect((res) => {
        const body = res.body as { error: string; message: string };
        expect(body).toHaveProperty('error');
        expect(body.message).toContain('limit는 1 이상이어야 합니다.');
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
    return request(app.getHttpServer()).delete(`/api/boards/${boardId}`);
  });

  it('/api/boards/:boardId (DELETE) 404 - 이미 삭제된 게시글 재삭제 시도', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'doubledelete@example.com',
      password: 'test1234',
      name: 'doubleDeleter',
      nickname: 'doubleDeleteNick',
      birthday: '2000-06-21',
      phoneNumber: '010-8888-9999',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 게시글 생성
    const createBoardDto = {
      title: '이중 삭제 테스트',
      content: '삭제될 내용',
      categoryName: 'FREE',
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

    // 3) 첫 번째 삭제 (성공)
    await request(app.getHttpServer())
      .delete(`/api/boards/${boardId}`)
      .expect(200);

    // 4) 두 번째 삭제 시도 (404 에러 발생)
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}`)
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body).toHaveProperty('path');
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('error', 'BOARD_NOT_FOUND');
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });
});
