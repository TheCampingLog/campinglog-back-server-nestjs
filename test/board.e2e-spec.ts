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

  it('/api/boards/search (GET) success - 키워드와 카테고리로 검색', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'searchtest@example.com',
      password: 'test1234',
      name: 'searcher',
      nickname: 'searchNick',
      birthday: '2000-06-21',
      phoneNumber: '010-5555-6666',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 여러 게시글 생성
    const board1 = {
      title: '캠핑 장비 추천',
      content: '텐트 추천합니다',
      categoryName: 'FREE',
      email: testUser.email,
    };

    const board2 = {
      title: '캠핑 요리 레시피',
      content: '맛있는 요리',
      categoryName: 'FREE',
      email: testUser.email,
    };

    const board3 = {
      title: '등산 후기',
      content: '등산 다녀왔어요',
      categoryName: 'NOTICE',
      email: testUser.email,
    };

    await request(app.getHttpServer()).post('/api/boards').send(board1);
    await request(app.getHttpServer()).post('/api/boards').send(board2);
    await request(app.getHttpServer()).post('/api/boards').send(board3);

    // 3) GET /api/boards/search?keyword=캠핑&category=FREE&page=1&size=10
    return request(app.getHttpServer())
      .get('/api/boards/search?keyword=캠핑&category=FREE&page=1&size=10')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          content: Array<{
            boardId: string;
            title: string;
            content: string;
            categoryName: string;
            viewCount: number;
            likeCount: number;
            commentCount: number;
            boardImage: string;
            createdAt: string;
            nickName: string;
            keyword: string;
          }>;
          totalPages: number;
          totalElements: number;
          pageNumber: number;
          pageSize: number;
          isFirst: boolean;
          isLast: boolean;
        };

        expect(body).toHaveProperty('content');
        expect(Array.isArray(body.content)).toBe(true);
        expect(body.content.length).toBeGreaterThan(0);
        expect(body).toHaveProperty('totalPages');
        expect(body).toHaveProperty('totalElements');
        expect(body).toHaveProperty('pageNumber');
        expect(body).toHaveProperty('pageSize');
        expect(body).toHaveProperty('isFirst');
        expect(body).toHaveProperty('isLast');

        // 검색 결과의 첫 번째 항목 검증
        if (body.content.length > 0) {
          const firstItem = body.content[0];
          expect(firstItem).toHaveProperty('boardId');
          expect(firstItem).toHaveProperty('title');
          expect(firstItem.title).toContain('캠핑');
          expect(firstItem).toHaveProperty('categoryName', 'FREE');
          expect(firstItem).toHaveProperty('nickName', 'searchNick');
          expect(firstItem).toHaveProperty('keyword', '캠핑');
        }
      });
  });

  it('/api/boards/search (GET) success - 페이징 테스트', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'pagingtest@example.com',
      password: 'test1234',
      name: 'pager',
      nickname: 'pagingNick',
      birthday: '2000-06-21',
      phoneNumber: '010-4444-5555',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 5개의 게시글 생성
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post('/api/boards')
        .send({
          title: `페이징 테스트 ${i}`,
          content: `내용 ${i}`,
          categoryName: 'FREE',
          email: testUser.email,
        });
    }

    // 3) GET /api/boards/search?keyword=페이징&category=FREE&page=2&size=2
    return request(app.getHttpServer())
      .get('/api/boards/search?keyword=페이징&category=FREE&page=2&size=2')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          content: unknown[];
          totalPages: number;
          totalElements: number;
          pageNumber: number;
          pageSize: number;
          isFirst: boolean;
          isLast: boolean;
        };

        expect(body.content.length).toBe(2); // size=2
        expect(body.totalElements).toBe(5);
        expect(body.totalPages).toBe(3); // 5개를 2개씩 = 3페이지
        expect(body.pageNumber).toBe(1); // 0-based (page 2 = index 1)
        expect(body.pageSize).toBe(2);
        expect(body.isFirst).toBe(false);
        expect(body.isLast).toBe(false);
      });
  });

  it('/api/boards/search (GET) default values', async () => {
    // keyword만 필수, 나머지는 기본값 적용 (category='', page=1, size=3)
    return request(app.getHttpServer())
      .get('/api/boards/search?keyword=테스트')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          content: unknown[];
          pageSize: number;
        };

        expect(body).toHaveProperty('content');
        expect(Array.isArray(body.content)).toBe(true);
        expect(body.pageSize).toBe(3); // 기본값
      });
  });

  it('/api/boards/search (GET) invalid page', async () => {
    // page < 1이면 400 에러
    return request(app.getHttpServer())
      .get('/api/boards/search?keyword=테스트&category=FREE&page=0&size=3')
      .expect(400)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body).toHaveProperty('path');
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('message');
        expect(body.message).toContain('page>=1, size>=1 이어야 합니다.');
      });
  });

  it('/api/boards/search (GET) invalid size', async () => {
    // size < 1이면 400 에러
    return request(app.getHttpServer())
      .get('/api/boards/search?keyword=테스트&category=FREE&page=1&size=0')
      .expect(400)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body).toHaveProperty('path');
        expect(body).toHaveProperty('timestamp');
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('message');
        expect(body.message).toContain('page>=1, size>=1 이어야 합니다.');
      });
  });

  it('/api/boards/:boardId (GET) success - 게시글 상세 조회', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'detailtest@example.com',
      password: 'test1234',
      name: 'detailUser',
      nickname: 'detailNick',
      birthday: '2000-06-21',
      phoneNumber: '010-1010-2020',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 게시글 생성
    const createBoardDto = {
      title: '상세 조회 테스트',
      content: '상세 내용입니다',
      categoryName: 'FREE',
      boardImage: 'test-image.jpg',
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

    // 3) GET /api/boards/:boardId 호출
    return request(app.getHttpServer())
      .get(`/api/boards/${boardId}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          boardId: string;
          title: string;
          content: string;
          categoryName: string;
          viewCount: number;
          likeCount: number;
          commentCount: number;
          boardImage: string;
          createdAt: string;
          nickName: string;
          email: string;
          isLiked: boolean;
        };

        expect(body).toHaveProperty('boardId', boardId);
        expect(body).toHaveProperty('title', '상세 조회 테스트');
        expect(body).toHaveProperty('content', '상세 내용입니다');
        expect(body).toHaveProperty('categoryName', 'FREE');
        expect(body).toHaveProperty('viewCount', 1); // 조회수 1 증가
        expect(body).toHaveProperty('likeCount', 0);
        expect(body).toHaveProperty('commentCount', 0);
        expect(body).toHaveProperty('boardImage', 'test-image.jpg');
        expect(body).toHaveProperty('createdAt');
        expect(body).toHaveProperty('nickName', 'detailNick');
        expect(body).toHaveProperty('email', testUser.email);
        expect(body).toHaveProperty('isLiked', false); // userEmail 없으면 false
      });
  });

  it('/api/boards/:boardId (GET) success - 조회수 증가 확인', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'viewcount@example.com',
      password: 'test1234',
      name: 'viewUser',
      nickname: 'viewNick',
      birthday: '2000-06-21',
      phoneNumber: '010-3030-4040',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 게시글 생성
    const createBoardDto = {
      title: '조회수 테스트',
      content: '내용',
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

    // 3) 첫 번째 조회 (viewCount: 1)
    const firstView = await request(app.getHttpServer())
      .get(`/api/boards/${boardId}`)
      .expect(200);

    const firstBody = firstView.body as { viewCount: number };
    expect(firstBody.viewCount).toBe(1);

    // 4) 두 번째 조회 (viewCount: 2)
    const secondView = await request(app.getHttpServer())
      .get(`/api/boards/${boardId}`)
      .expect(200);

    const secondBody = secondView.body as { viewCount: number };
    expect(secondBody.viewCount).toBe(2);
  });

  it('/api/boards/:boardId (GET) success - userEmail로 좋아요 여부 확인', async () => {
    // 1) 회원 생성
    const testUser: RequestAddMemeberDto = {
      email: 'likechecktest@example.com',
      password: 'test1234',
      name: 'likeUser',
      nickname: 'likeNick',
      birthday: '2000-06-21',
      phoneNumber: '010-5050-6060',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    // 2) 게시글 생성
    const createBoardDto = {
      title: '좋아요 확인 테스트',
      content: '내용',
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

    // 3) userEmail 파라미터와 함께 조회
    return request(app.getHttpServer())
      .get(`/api/boards/${boardId}?userEmail=${testUser.email}`)
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          boardId: string;
          isLiked: boolean;
        };

        expect(body).toHaveProperty('boardId', boardId);
        expect(body).toHaveProperty('isLiked'); // isLiked 필드 존재 확인
        // 좋아요를 누르지 않았으므로 false
        expect(body.isLiked).toBe(false);
      });
  });

  it('/api/boards/:boardId (GET) 404 - 존재하지 않는 게시글 조회', async () => {
    return request(app.getHttpServer())
      .get('/api/boards/nonexistent-board-id')
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
