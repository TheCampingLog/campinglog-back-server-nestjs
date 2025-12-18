import { RequestAddMemberDto } from 'src/auth/dto/request/request-add-member.dto';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Member } from 'src/auth/entities/member.entity';
import { Board } from 'src/board/entities/board.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import cookieParser from 'cookie-parser';
import { createTestMember } from 'src/member/test/fixtures/member.fixture';
import { RankResult } from 'src/member/interfaces/member.interface';
import * as crypto from 'crypto';
import { ResponseGetMemberDto } from 'src/member/dto/response/response-get-member.dto';

describe('MemberController (e2e)', () => {
  let app: INestApplication<App>;
  let memberRepository: Repository<Member>;
  let boardRepository: Repository<Board>;
  let boardLikeRepository: Repository<BoardLike>;

  beforeAll(async () => {
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

    memberRepository = moduleFixture.get('MemberRepository');
    boardRepository = moduleFixture.get('BoardRepository');
    boardLikeRepository = moduleFixture.get('BoardLikeRepository');
  });
  //회원 랭킹 조회
  const createTestBoard = (email: string, likeCount: number) => {
    const board = boardRepository.create({
      title: '첫번째 게시판',
      content: '내용',
      categoryName: '자유',
      likeCount: likeCount,
      member: { email: email } as Member,
    });

    return board;
  };

  //회원 랭킹 조회
  const createAndSaveMember = async (email: string): Promise<Member> => {
    const testMember = await createTestMember(email);
    const member = memberRepository.create(testMember);
    const resultMember = await memberRepository.save(member);
    return resultMember;
  };

  //회원 랭킹 조회
  const createAndSaveBoard = async (
    email: string,
    likeCount: number,
  ): Promise<Board> => {
    const testBoard = createTestBoard(email, likeCount);
    const resultBoard = await boardRepository.save(testBoard);
    return resultBoard;
  };

  //회원 랭킹 조회
  const createAndSaveBoardLike = async (
    member: Member,
    board: Board,
  ): Promise<BoardLike> => {
    const testBoardLike = boardLikeRepository.create({ member, board });
    const resultBoardLike = await boardLikeRepository.save(testBoardLike);
    return resultBoardLike;
  };

  afterEach(async () => {
    await memberRepository.clear();
    await boardRepository.clear();
    await boardLikeRepository.clear();
  });

  afterAll(async () => {
    await app.close();
  });

  // 회원승급
  it('/api/members/grade (PUT) success', async () => {
    interface UpdateGradeResponse {
      changed: number;
    }

    //when & then
    const response = await request(app.getHttpServer())
      .put('/api/members/grade')
      .expect(200);

    const result = response.body as UpdateGradeResponse;

    expect(result.changed).toBe(0);
  });

  // 회원 랭킹 조회
  it('/api/members/rank (GET) success', async () => {
    //given
    //테스트 멤버 6개 생성
    const [
      testMember1,
      testMember2,
      testMember3,
      testMember4,
      testMember5,
      testMember6,
    ] = await Promise.all([
      createAndSaveMember('test1@example.com'),
      createAndSaveMember('test2@example.com'),
      createAndSaveMember('test3@example.com'),
      createAndSaveMember('test4@example.com'),
      createAndSaveMember('test5@example.com'),
      createAndSaveMember('test6@example.com'),
    ]);
    //테스트 보드 3개 생성
    const [testBoard1, testBoard2, testBoard3] = await Promise.all([
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember2.email, 10),
      createAndSaveBoard(testMember3.email, 10),
    ]);
    //테스트 좋아요 (testMember1: 1개, testMember2: 2개, testMember3: 3개)
    await Promise.all([
      createAndSaveBoardLike(testMember2, testBoard1),
      createAndSaveBoardLike(testMember1, testBoard2),
      createAndSaveBoardLike(testMember3, testBoard2),
      createAndSaveBoardLike(testMember4, testBoard3),
      createAndSaveBoardLike(testMember5, testBoard3),
      createAndSaveBoardLike(testMember6, testBoard3),
    ]);

    //when
    const response = await request(app.getHttpServer())
      .get('/api/members/rank')
      .query('memberNo=2')
      .expect(200);

    const result = response.body as RankResult[];

    //then
    expect(result.length).toBe(2);
    expect(result[0].email).toBe('test3@example.com');
  });

  // 마이 페이지 조회
  it('/api/members/mypage (GET) success', async () => {
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
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

    //given
    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when & then
    const response = await request(app.getHttpServer())
      .get('/api/members/mypage')
      .set('authorization', accessToken)
      .expect(200);

    const result = response.body as ResponseGetMemberDto;
    expect(result.email).toBe(testUser.email);
  });

  // 마이 페이지 조회
  it('/api/members/mypage (GET) fail', async () => {
    const testUser: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
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

    //given
    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    await request(app.getHttpServer())
      .delete('/api/members')
      .set('authorization', accessToken)
      .expect(204);

    //when & then
    await request(app.getHttpServer())
      .get('/api/members/mypage')
      .set('authorization', accessToken)
      .expect(404);
  });
});
