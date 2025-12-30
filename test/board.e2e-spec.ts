import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { RequestAddMemberDto } from 'src/auth/dto/request/request-add-member.dto';
import { ValidationPipe } from '@nestjs/common';
import { Member } from 'src/auth/entities/member.entity';
import { Board } from 'src/board/entities/board.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import { Comment } from 'src/board/entities/comment.entity';
import { Repository } from 'typeorm';
import cookieParser from 'cookie-parser';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

describe('BoardController (e2e)', () => {
  let app: INestApplication<App>;
  let memberRepository: Repository<Member>;
  let boardRepository: Repository<Board>;
  let boardLikeRepository: Repository<BoardLike>;
  let commentRepository: Repository<Comment>;

  beforeAll(async () => {
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();

    app.use(cookieParser());

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
    boardRepository = moduleFixture.get('BoardRepository');
    memberRepository = moduleFixture.get('MemberRepository');
    commentRepository = moduleFixture.get('CommentRepository');
    boardLikeRepository = moduleFixture.get('BoardLikeRepository');
  });

  afterAll(async () => {
    await app.close();
  });

  const createMemberAndLogin = async (
    email: string,
    nickname?: string,
  ): Promise<{ email: string; accessToken: string }> => {
    const testUser: RequestAddMemberDto = {
      email,
      password: 'test1234',
      name: 'tester',
      nickname: nickname || `${email.split('@')[0]}Nick`,
      birthday: '2000-06-21',
      phoneNumber: '010-1234-5678',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(testUser)
      .expect(201);

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({ email, password: 'test1234' })
      .expect(200);

    expect(loginResponse.headers['authorization']).toBeTruthy();

    return {
      email,
      accessToken: loginResponse.headers['authorization'],
    };
  };

  afterEach(async () => {
    await commentRepository.clear();
    await boardLikeRepository.clear();
    await boardRepository.clear();
    await memberRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/api/boards (POST) success', async () => {
    const { accessToken } = await createMemberAndLogin(
      'boardtest@example.com',
      'nick',
    );
    const testBoard = {
      title: '테스트 제목',
      content: '테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    const response = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(testBoard)
      .expect(201);

    expect(response.body).toHaveProperty('message', '게시글이 등록되었습니다.');
  });

  it('/api/boards/:boardId (PUT) success', async () => {
    const { accessToken } = await createMemberAndLogin(
      'boardupdate@example.com',
      'updateNick',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '원래 제목',
      content: '원래 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = createRes.body as BoardResponse;

    expect(boardId).toBeDefined();

    // 4) 게시글 수정
    const updateBoardDto = {
      title: '수정된 제목',
      content: '수정된 내용',
      categoryName: 'NOTICE',
      boardImage: 'updated-image',
    };

    // 5) PUT /api/boards/:boardId 호출
    return request(app.getHttpServer())
      .put(`/api/boards/${boardId}`)
      .set('authorization', accessToken)
      .send(updateBoardDto)
      .expect(200)
      .expect((res) => {
        expect(res.body).toHaveProperty('message', '게시글이 수정되었습니다.');
      });
  });

  it('/api/boards/rank (GET) success', async () => {
    const { accessToken } = await createMemberAndLogin(
      'ranktest@example.com',
      'rankNick',
    );

    // 3) 여러 게시글 생성
    const board1 = {
      title: '인기 게시글 1',
      content: '내용1',
      categoryName: 'FREE',
    };

    const board2 = {
      title: '인기 게시글 2',
      content: '내용2',
      categoryName: 'FREE',
    };

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board1)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board2)
      .expect(201);

    // 4) GET /api/boards/rank?limit=2 호출
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
    const { accessToken } = await createMemberAndLogin(
      'boarddelete@example.com',
      'deleteNick',
    );

    // 3) 게시글 생성
    const createBoardDto = {
      title: '삭제할 제목',
      content: '삭제할 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = createRes.body as BoardResponse;

    expect(boardId).toBeDefined();

    // 4) DELETE /api/boards/:boardId 호출
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}`)
      .set('authorization', accessToken)
      .expect(204);
  });

  it('/api/boards/:boardId (DELETE) 404 - 이미 삭제된 게시글 재삭제 시도', async () => {
    const { accessToken } = await createMemberAndLogin(
      'doubledelete@example.com',
      'doubleDeleteNick',
    );

    // 3) 게시글 생성
    const createBoardDto = {
      title: '이중 삭제 테스트',
      content: '삭제될 내용',
      categoryName: 'FREE',
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = createRes.body as BoardResponse;

    // 4) 첫 번째 삭제 (성공)
    await request(app.getHttpServer())
      .delete(`/api/boards/${boardId}`)
      .set('authorization', accessToken)
      .expect(204);

    // 5) 두 번째 삭제 시도 (404 에러 발생)
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}`)
      .set('authorization', accessToken)
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
    const { accessToken } = await createMemberAndLogin(
      'searchtest@example.com',
      'searchNick',
    );

    // 3) 여러 게시글 생성
    const board1 = {
      title: '캠핑 장비 추천',
      content: '텐트 추천합니다',
      categoryName: 'FREE',
    };

    const board2 = {
      title: '캠핑 요리 레시피',
      content: '맛있는 요리',
      categoryName: 'FREE',
    };

    const board3 = {
      title: '등산 후기',
      content: '등산 다녀왔어요',
      categoryName: 'NOTICE',
    };

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board1)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board2)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board3)
      .expect(201);

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
            nickname: string;
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
          expect(firstItem).toHaveProperty('nickname', 'searchNick');
          expect(firstItem).toHaveProperty('keyword', '캠핑');
        }
      });
  });

  it('/api/boards/search (GET) success - 페이징 테스트', async () => {
    const { accessToken } = await createMemberAndLogin(
      'pagingtest@example.com',
      'pagingNick',
    );

    // 3) 5개의 게시글 생성
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post('/api/boards')
        .set('authorization', accessToken)
        .send({
          title: `페이징 테스트 ${i}`,
          content: `내용 ${i}`,
          categoryName: 'FREE',
        })
        .expect(201);
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
    const { email: testEmail, accessToken } = await createMemberAndLogin(
      'detailtest@example.com',
      'detailNick',
    );

    // 3) 게시글 생성
    const createBoardDto = {
      title: '상세 조회 테스트',
      content: '상세 내용입니다',
      categoryName: 'FREE',
      boardImage: 'test-image.jpg',
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
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
          nickname: string;
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
        expect(body).toHaveProperty('nickname', 'detailNick');
        expect(body).toHaveProperty('email', testEmail);
        expect(body).toHaveProperty('isLiked', false); // userEmail 없으면 false
      });
  });

  it('/api/boards/:boardId (GET) success - 조회수 증가 확인', async () => {
    const { accessToken } = await createMemberAndLogin(
      'viewcount@example.com',
      'viewNick',
    );

    // 3) 게시글 생성
    const createBoardDto = {
      title: '조회수 테스트',
      content: '내용',
      categoryName: 'FREE',
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
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
    const { email: testEmail, accessToken } = await createMemberAndLogin(
      'likechecktest@example.com',
      'likeNick',
    );

    // 3) 게시글 생성
    const createBoardDto = {
      title: '좋아요 확인 테스트',
      content: '내용',
      categoryName: 'FREE',
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const createRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = createRes.body as BoardResponse;

    // 3) userEmail 파라미터와 함께 조회
    return request(app.getHttpServer())
      .get(`/api/boards/${boardId}?userEmail=${testEmail}`)
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

  it('/api/boards/category (GET) success - 카테고리별 게시글 조회', async () => {
    const { accessToken } = await createMemberAndLogin(
      'categorytest@example.com',
      'categoryNick',
    );

    // 2) 여러 카테고리의 게시글 생성
    const board1 = {
      title: 'FREE 게시글 1',
      content: '자유 게시판 내용 1',
      categoryName: 'FREE',
    };

    const board2 = {
      title: 'FREE 게시글 2',
      content: '자유 게시판 내용 2',
      categoryName: 'FREE',
    };

    const board3 = {
      title: 'NOTICE 게시글',
      content: '공지사항',
      categoryName: 'NOTICE',
    };

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board1)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board2)
      .expect(201);

    await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(board3)
      .expect(201);

    // 3) GET /api/boards/category?category=FREE&page=1&size=10
    return request(app.getHttpServer())
      .get('/api/boards/category?category=FREE&page=1&size=10')
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
            nickname: string;
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
        expect(body.content.length).toBe(2); // FREE 게시글 2개
        expect(body).toHaveProperty('totalPages');
        expect(body).toHaveProperty('totalElements', 2);
        expect(body).toHaveProperty('pageNumber');
        expect(body).toHaveProperty('pageSize');
        expect(body).toHaveProperty('isFirst');
        expect(body).toHaveProperty('isLast');

        // 모든 게시글이 FREE 카테고리인지 확인
        body.content.forEach((board) => {
          expect(board.categoryName).toBe('FREE');
          expect(board.nickname).toBe('categoryNick');
        });
      });
  });

  it('/api/boards/category (GET) success - 페이징 테스트', async () => {
    const { accessToken } = await createMemberAndLogin(
      'categorypaging@example.com',
      'pagingNick',
    );

    // 2) 5개의 게시글 생성
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post('/api/boards')
        .set('authorization', accessToken)
        .send({
          title: `카테고리 테스트 ${i}`,
          content: `내용 ${i}`,
          categoryName: 'FREE',
        })
        .expect(201);
    }

    // 3) GET /api/boards/category?category=FREE&page=2&size=2
    return request(app.getHttpServer())
      .get('/api/boards/category?category=FREE&page=2&size=2')
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

  it('/api/boards/category (GET) success - 빈 결과', async () => {
    // 존재하지 않는 카테고리 조회
    return request(app.getHttpServer())
      .get('/api/boards/category?category=NONEXISTENT&page=1&size=10')
      .expect(200)
      .expect((res) => {
        const body = res.body as {
          content: unknown[];
          totalElements: number;
        };

        expect(body.content.length).toBe(0);
        expect(body.totalElements).toBe(0);
      });
  });

  it('/api/boards/category (GET) default values', async () => {
    // category만 필수, 나머지는 기본값 적용 (page=1, size=3)
    return request(app.getHttpServer())
      .get('/api/boards/category?category=FREE')
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

  it('/api/boards/category (GET) invalid page', async () => {
    // page < 1이면 400 에러
    return request(app.getHttpServer())
      .get('/api/boards/category?category=FREE&page=0&size=3')
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

  it('/api/boards/category (GET) invalid size', async () => {
    // size < 1이면 400 에러
    return request(app.getHttpServer())
      .get('/api/boards/category?category=FREE&page=1&size=0')
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

  it('/api/boards/:boardId/comment (POST) success', async () => {
    const { accessToken } = await createMemberAndLogin(
      'comment-test@example.com',
      'commentTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 테스트 게시글',
      content: '댓글 작성 테스트',
      categoryName: 'FREE',
      boardImage: '',
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) POST /api/boards/:boardId/comment 호출
    return request(app.getHttpServer())
      .post(`/api/boards/${boardId}/comment`)
      .set('authorization', accessToken)
      .send({ content: '댓글 내용입니다.' })
      .expect(201)
      .expect((res) => {
        const body = res.body as {
          message: string;
          boardId: string;
          commentId: string;
        };
        expect(body).toHaveProperty('message', '댓글이 등록되었습니다.');
        expect(body).toHaveProperty('boardId', boardId);
        expect(body).toHaveProperty('commentId');
        expect(body.commentId).toBeDefined();
      });
  });

  it('/api/boards/:boardId/comment (POST) board not found', async () => {
    const { accessToken } = await createMemberAndLogin(
      'comment-notfound@example.com',
      'notFoundNick',
    );

    // 존재하지 않는 게시글에 댓글 작성 시도
    return request(app.getHttpServer())
      .post('/api/boards/nonexistent-board-id/comment')
      .set('authorization', accessToken)
      .send({ content: '댓글 내용' })
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
        expect(body).toHaveProperty('error');
        expect(body).toHaveProperty('message');
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/comment (POST) invalid content', async () => {
    const { accessToken } = await createMemberAndLogin(
      'comment-invalid@example.com',
      'commentInvalidTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 테스트 게시글',
      content: '댓글 작성 테스트',
      categoryName: 'FREE',
      boardImage: '',
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 빈 content로 댓글 작성 시도
    return request(app.getHttpServer())
      .post(`/api/boards/${boardId}/comment`)
      .set('authorization', accessToken)
      .send({ content: '' })
      .expect(400);
  });

  it('/api/boards/:boardId/comment (POST) validation error', async () => {
    const { accessToken } = await createMemberAndLogin(
      'comment-validation-test@example.com',
      'commentValidationTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 테스트 게시글',
      content: '댓글 작성 테스트',
      categoryName: 'FREE',
      boardImage: '',
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) content 누락 (validation error)
    return request(app.getHttpServer())
      .post(`/api/boards/${boardId}/comment`)
      .set('authorization', accessToken)
      .send({})
      .expect(400);
  });

  it('/api/boards/:boardId/comments (GET) success', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentGetTester@test.com',
      'commentGetTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 조회 테스트 게시글',
      content: '댓글 조회 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 댓글 3개 생성
    for (let i = 1; i <= 3; i++) {
      await request(app.getHttpServer())
        .post(`/api/boards/${boardId}/comment`)
        .set('authorization', accessToken)
        .send({ content: `댓글 ${i}` })
        .expect(201);
    }

    // 4) 댓글 조회
    const res = await request(app.getHttpServer())
      .get(`/api/boards/${boardId}/comments`)
      .query({ page: 1, size: 10 })
      .expect(200);

    const body = res.body as {
      content: Array<{
        commentId: string;
        content: string;
        nickname: string;
        email: string;
        createdAt: string;
      }>;
      totalComments: number;
      totalPages: number;
      pageNumber: number;
      pageSize: number;
      isFirst: boolean;
      isLast: boolean;
    };

    expect(body.content).toHaveLength(3);
    expect(body.totalComments).toBe(3);
    expect(body.totalPages).toBe(1);
    expect(body.pageNumber).toBe(1);
    expect(body.content[0].nickname).toBe('commentGetTester');
  });

  it('/api/boards/:boardId/comments (GET) pagination', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentPaginationTester@test.com',
      'commentPaginationTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '페이지네이션 테스트 게시글',
      content: '페이지네이션 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 댓글 5개 생성
    for (let i = 1; i <= 5; i++) {
      await request(app.getHttpServer())
        .post(`/api/boards/${boardId}/comment`)
        .set('authorization', accessToken)
        .send({ content: `댓글 ${i}` })
        .expect(201);
    }

    // 4) 2페이지 조회 (size=2)
    const res = await request(app.getHttpServer())
      .get(`/api/boards/${boardId}/comments`)
      .query({ page: 2, size: 2 })
      .expect(200);

    const body = res.body as {
      content: Array<{
        commentId: string;
        content: string;
        nickname: string;
        email: string;
        createdAt: string;
      }>;
      totalComments: number;
      totalPages: number;
      pageNumber: number;
      pageSize: number;
      isFirst: boolean;
      isLast: boolean;
    };

    expect(body.content).toHaveLength(2);
    expect(body.totalComments).toBe(5);
    expect(body.totalPages).toBe(3);
    expect(body.pageNumber).toBe(2);
  });

  it('/api/boards/:boardId/comments (GET) board not found', async () => {
    return request(app.getHttpServer())
      .get('/api/boards/invalid-board-id/comments')
      .query({ page: 1, size: 3 })
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/comments/:commentId (PUT) success', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentUpdateTester@test.com',
      'commentUpdateTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 수정 테스트 게시글',
      content: '댓글 수정 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 댓글 생성
    const commentRes = await request(app.getHttpServer())
      .post(`/api/boards/${boardId}/comment`)
      .set('authorization', accessToken)
      .send({ content: '원래 댓글 내용' })
      .expect(201);

    const { commentId } = commentRes.body as { commentId: string };

    // 4) 댓글 수정
    const res = await request(app.getHttpServer())
      .put(`/api/boards/${boardId}/comments/${commentId}`)
      .set('authorization', accessToken)
      .send({ content: '수정된 댓글 내용' })
      .expect(200);

    const body = res.body as {
      message: string;
      status: string;
    };
    expect(body.message).toBe('댓글이 수정되었습니다.');
    expect(body.status).toBe('success');
  });

  it('/api/boards/:boardId/comments/:commentId (PUT) board not found', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentUpdateNotFound@test.com',
      'notFoundNick',
    );

    return request(app.getHttpServer())
      .put('/api/boards/invalid-board-id/comments/comment-id')
      .set('authorization', accessToken)
      .send({ content: '수정 내용' })
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/comments/:commentId (PUT) comment not found', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentUpdateNotFoundTester@test.com',
      'commentUpdateNotFoundTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 수정 테스트 게시글',
      content: '댓글 수정 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 존재하지 않는 댓글 수정 시도
    return request(app.getHttpServer())
      .put(`/api/boards/${boardId}/comments/invalid-comment-id`)
      .set('authorization', accessToken)
      .send({ content: '수정 내용' })
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('댓글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/comments/:commentId (PUT) not your comment', async () => {
    // 1) 회원 2명 생성
    const { accessToken: ownerToken } = await createMemberAndLogin(
      'commentOwner@test.com',
      'commentOwner',
    );

    const { accessToken: otherToken } = await createMemberAndLogin(
      'otherUser@test.com',
      'otherUser',
    );

    // 2) 게시글 생성 (owner)
    const createBoardDto = {
      title: '댓글 소유자 테스트',
      content: '댓글 소유자 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', ownerToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 댓글 생성 (owner)
    const commentRes = await request(app.getHttpServer())
      .post(`/api/boards/${boardId}/comment`)
      .set('authorization', ownerToken)
      .send({ content: '원래 댓글 내용' })
      .expect(201);

    const { commentId } = commentRes.body as { commentId: string };

    // 4) 다른 사람이 댓글 수정 시도 (other)
    return request(app.getHttpServer())
      .put(`/api/boards/${boardId}/comments/${commentId}`)
      .set('authorization', otherToken)
      .send({ content: '수정 시도' })
      .expect(403)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('본인의 댓글만 수정할 수 있습니다.');
      });
  });

  it('/api/boards/:boardId/comments/:commentId (DELETE) success', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentDeleteTester@test.com',
      'commentDeleteTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 삭제 테스트 게시글',
      content: '댓글 삭제 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 댓글 생성
    const commentRes = await request(app.getHttpServer())
      .post(`/api/boards/${boardId}/comment`)
      .set('authorization', accessToken)
      .send({ content: '삭제할 댓글' })
      .expect(201);

    const { commentId } = commentRes.body as { commentId: string };

    // 4) 댓글 삭제
    const res = await request(app.getHttpServer())
      .delete(`/api/boards/${boardId}/comments/${commentId}`)
      .set('authorization', accessToken)
      .expect(200);

    const body = res.body as {
      message: string;
      status: string;
    };
    expect(body.message).toBe('댓글이 삭제되었습니다.');
    expect(body.status).toBe('success');
  });

  it('/api/boards/:boardId/comments/:commentId (DELETE) board not found', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentDeleteNotFound@test.com',
      'deleteNotFoundNick',
    );

    return request(app.getHttpServer())
      .delete('/api/boards/invalid-board-id/comments/comment-id')
      .set('authorization', accessToken)
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/comments/:commentId (DELETE) comment not found', async () => {
    const { accessToken } = await createMemberAndLogin(
      'commentDeleteNotFoundTester@test.com',
      'commentDeleteNotFoundTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '댓글 삭제 테스트 게시글',
      content: '댓글 삭제 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 존재하지 않는 댓글 삭제 시도
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}/comments/invalid-comment-id`)
      .set('authorization', accessToken)
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('댓글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/comments/:commentId (DELETE) not your comment', async () => {
    // 1) 회원 2명 생성
    const { accessToken: ownerToken } = await createMemberAndLogin(
      'commentDeleteOwner@test.com',
      'commentDeleteOwner',
    );

    const { accessToken: otherToken } = await createMemberAndLogin(
      'commentDeleteOther@test.com',
      'commentDeleteOther',
    );

    // 2) 게시글 생성 (owner)
    const createBoardDto = {
      title: '댓글 삭제 소유자 테스트',
      content: '댓글 삭제 소유자 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', ownerToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 댓글 생성 (owner)
    const commentRes = await request(app.getHttpServer())
      .post(`/api/boards/${boardId}/comment`)
      .set('authorization', ownerToken)
      .send({ content: '삭제할 댓글' })
      .expect(201);

    const { commentId } = commentRes.body as { commentId: string };

    // 4) 다른 사람이 댓글 삭제 시도 (other)
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}/comments/${commentId}`)
      .set('authorization', otherToken)
      .expect(403)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('본인의 댓글만 삭제할 수 있습니다.');
      });
  });

  it('/api/boards/:boardId/likes (GET) success - no likes', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeGetTester@test.com',
      'likeGetTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '좋아요 조회 테스트 게시글',
      content: '좋아요 조회 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 좋아요 조회
    const res = await request(app.getHttpServer())
      .get(`/api/boards/${boardId}/likes`)
      .expect(200);

    const body = res.body as {
      boardId: string;
      likeCount: number;
    };
    expect(body.boardId).toBe(boardId);
    expect(body.likeCount).toBe(0);
  });

  it('/api/boards/:boardId/likes (GET) board not found', async () => {
    return request(app.getHttpServer())
      .get('/api/boards/invalid-board-id/likes')
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/likes (POST) success - add like', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeAddTester@test.com',
      'likeAddTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '좋아요 추가 테스트 게시글',
      content: '좋아요 추가 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 좋아요 추가
    const res = await request(app.getHttpServer())
      .post(`/api/boards/${boardId}/likes`)
      .set('authorization', accessToken)
      .send({})
      .expect(201);

    const body = res.body as {
      isLiked: boolean;
      likeCount: number;
    };
    expect(body.isLiked).toBe(true);
    expect(body.likeCount).toBe(1);
  });

  it('/api/boards/:boardId/likes (POST) already liked', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeAlreadyTester@test.com',
      'likeAlreadyTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '좋아요 중복 테스트 게시글',
      content: '좋아요 중복 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 첫 번째 좋아요 추가
    await request(app.getHttpServer())
      .post(`/api/boards/${boardId}/likes`)
      .set('authorization', accessToken)
      .send({})
      .expect(201);

    // 4) 두 번째 좋아요 추가 시도 (중복)
    return request(app.getHttpServer())
      .post(`/api/boards/${boardId}/likes`)
      .set('authorization', accessToken)
      .send({})
      .expect(409)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('이미 좋아요를 누른 게시글입니다.');
      });
  });

  it('/api/boards/:boardId/likes (POST) board not found', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeNoBoardTester@test.com',
      'likeNoBoardTester',
    );

    // 2) 존재하지 않는 게시글에 좋아요 추가
    return request(app.getHttpServer())
      .post('/api/boards/invalid-board-id/likes')
      .set('authorization', accessToken)
      .send({})
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/likes (POST) unauthorized', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeBoardOnlyTester@test.com',
      'likeBoardOnlyTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '인증 테스트 게시글',
      content: '인증 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 인증 없이 좋아요 추가 시도
    return request(app.getHttpServer())
      .post(`/api/boards/${boardId}/likes`)
      .send({})
      .expect(401);
  });

  it('/api/boards/:boardId/likes (DELETE) success - delete like', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeDeleteTester@test.com',
      'likeDeleteTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '좋아요 삭제 테스트 게시글',
      content: '좋아요 삭제 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 좋아요 추가
    await request(app.getHttpServer())
      .post(`/api/boards/${boardId}/likes`)
      .set('authorization', accessToken)
      .send({})
      .expect(201);

    // 4) 좋아요 삭제
    const res = await request(app.getHttpServer())
      .delete(`/api/boards/${boardId}/likes`)
      .set('authorization', accessToken)
      .expect(200);

    const body = res.body as {
      isLiked: boolean;
      likeCount: number;
    };
    expect(body.isLiked).toBe(false);
    expect(body.likeCount).toBe(0);
  });

  it('/api/boards/:boardId/likes (DELETE) not liked', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeNotLikedTester@test.com',
      'likeNotLikedTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '좋아요 안누름 테스트 게시글',
      content: '좋아요 안누름 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 좋아요를 누르지 않고 삭제 시도
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}/likes`)
      .set('authorization', accessToken)
      .expect(400)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('좋아요를 누르지 않은 게시글입니다.');
      });
  });

  it('/api/boards/:boardId/likes (DELETE) board not found', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeDelNoBoardTester@test.com',
      'likeDelNoBoardTester',
    );

    // 2) 존재하지 않는 게시글에서 좋아요 삭제
    return request(app.getHttpServer())
      .delete('/api/boards/invalid-board-id/likes')
      .set('authorization', accessToken)
      .expect(404)
      .expect((res) => {
        const body = res.body as {
          path: string;
          timestamp: string;
          error: string;
          message: string;
        };
        expect(body.message).toContain('게시글을 찾을 수 없습니다.');
      });
  });

  it('/api/boards/:boardId/likes (DELETE) unauthorized', async () => {
    const { accessToken } = await createMemberAndLogin(
      'likeDelUnauthorizedTester@test.com',
      'likeDelUnauthorizedTester',
    );

    // 2) 게시글 생성
    const createBoardDto = {
      title: '인증 테스트 게시글',
      content: '인증 테스트 내용',
      categoryName: 'FREE',
      boardImage: null,
    };

    interface BoardResponse {
      message: string;
      boardId: string;
    }

    const boardRes = await request(app.getHttpServer())
      .post('/api/boards')
      .set('authorization', accessToken)
      .send(createBoardDto)
      .expect(201);

    const { boardId } = boardRes.body as BoardResponse;

    // 3) 인증 없이 좋아요 삭제 시도
    return request(app.getHttpServer())
      .delete(`/api/boards/${boardId}/likes`)
      .expect(401);
  });
});
