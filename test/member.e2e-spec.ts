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
import { Comment } from 'src/board/entities/comment.entity';
import cookieParser from 'cookie-parser';
import { createTestMember } from 'src/member/test/fixtures/member.fixture';
import { RankResult } from 'src/member/interfaces/member.interface';
import * as crypto from 'crypto';
import { ResponseGetMemberDto } from 'src/member/dto/response/response-get-member.dto';
import { RequestUpdateMemberDto } from 'src/member/dto/request/request-update-member.dto';
import { ResponseGetMemberBoardListDto } from 'src/member/dto/response/response-get-member-board-list.dto';
import { ResponseGetMemberCommentListDto } from 'src/member/dto/response/response-get-member-comment-list.dto';
import { RequestSetProfileImageDto } from 'src/member/dto/request/request-set-profile-image.dto';
import { ResponseGetMemberProfileImageDto } from 'src/member/dto/response/response-get-member-profile-image.dto';
import { ReqeustVerifyPasswordDto } from 'src/member/dto/request/request-verify-password.dto';
import { RequestChangePasswordDto } from 'src/member/dto/request/request-change-password.dto';
import { ResponseGetMemberActivityDto } from 'src/member/dto/response/response-get-member-activity.dto';
import { Review } from 'src/campinfo/entities/review.entity';
import { ResponseGetMyReviewWrapper } from 'src/campinfo/dto/response/response-get-my-review-rapper.dto';

describe('MemberController (e2e)', () => {
  let app: INestApplication<App>;
  let memberRepository: Repository<Member>;
  let boardRepository: Repository<Board>;
  let boardLikeRepository: Repository<BoardLike>;
  let commentRepository: Repository<Comment>;
  let reviewRepository: Repository<Review>;

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
    commentRepository = moduleFixture.get('CommentRepository');
    reviewRepository = moduleFixture.get('ReviewRepository');
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

  // 내가 쓴 댓글 리스트 조회
  const createAndSaveComment = async (
    member: Member,
    board: Board,
  ): Promise<Comment> => {
    const testComment = commentRepository.create({
      content: '테스트',
      member,
      board,
    });
    const resultComment = await commentRepository.save(testComment);
    return resultComment;
  };

  // 내 활동 조회
  const createAndSaveReview = async (member: Member): Promise<Review> => {
    const testReview = reviewRepository.create({
      mapX: '127.2636514',
      mapY: '37.0323408',
      reviewContent: '테스트 리뷰',
      reviewScore: 4,
      member: member,
    });
    const resultReview = await reviewRepository.save(testReview);
    return resultReview;
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

  // 마이 페이지 정보 수정
  it('/api/members/mypage (PUT) success', async () => {
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

    const requestUpdateMemberDto: RequestUpdateMemberDto = {
      nickname: '변경된 닉네임',
      phoneNumber: '010-9876-4321',
    };
    //given
    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when & then
    await request(app.getHttpServer())
      .put('/api/members/mypage')
      .set('authorization', accessToken)
      .send(requestUpdateMemberDto)
      .expect(204);
  });

  // 마이 페이지 정보 수정
  it('/api/members/mypage (PUT) fail', async () => {
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

    const duplicateNicknameMember: RequestAddMemberDto = {
      email: `${crypto.randomInt(0, 10000000000)}@example.com`,
      password: 'test1234',
      name: 'tester',
      nickname: '중복된 닉네임',
      birthday: '2000-06-21',
      phoneNumber: '010-1234-5678',
    };

    await request(app.getHttpServer())
      .post('/api/members')
      .send(duplicateNicknameMember)
      .expect(201);

    const validMember = {
      email: testUser.email,
      password: testUser.password,
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const requestUpdateMemberDto: RequestUpdateMemberDto = {
      nickname: '중복된 닉네임',
      phoneNumber: '010-9876-4321',
    };
    //given
    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when & then
    await request(app.getHttpServer())
      .put('/api/members/mypage')
      .set('authorization', accessToken)
      .send(requestUpdateMemberDto)
      .expect(400);
  });

  //내가 쓴 글 조회
  it('/api/members/mypage/boards (GET) success', async () => {
    //given
    const testMember1 = await createAndSaveMember('test1@example.com');

    await Promise.all([
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
    ]);

    const validMember = {
      email: testMember1.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when
    const response = await request(app.getHttpServer())
      .get('/api/members/mypage/boards')
      .query('pageNo=2')
      .set('authorization', accessToken)
      .expect(200);

    const result = response.body as ResponseGetMemberBoardListDto;

    expect(result.items.length).toBe(3);
  });

  //내가 작성한 댓글 리스트 조회
  it('/api/members/mypage/comments (GET) success', async () => {
    //given
    //테스트 멤버 1개 생성
    const testMember = await createAndSaveMember('test1@example.com');
    //테스트 보드 1개 생성
    const testBoard = await createAndSaveBoard(testMember.email, 10);
    //테스트 댓글 7개 생성
    await Promise.all([
      createAndSaveComment(testMember, testBoard),
      createAndSaveComment(testMember, testBoard),
      createAndSaveComment(testMember, testBoard),
      createAndSaveComment(testMember, testBoard),
      createAndSaveComment(testMember, testBoard),
      createAndSaveComment(testMember, testBoard),
      createAndSaveComment(testMember, testBoard),
    ]);

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when
    const response = await request(app.getHttpServer())
      .get('/api/members/mypage/comments')
      .query('pageNo=2')
      .set('authorization', accessToken)
      .expect(200);

    const result = response.body as ResponseGetMemberCommentListDto;

    expect(result.items.length).toBe(3);
  });

  // 내가 작성한 리뷰 리스트 조회 (Full Integration Test)
  it('/api/members/mypage/reviews (GET) success', async () => {
    // [Given]
    const testMember = await createAndSaveMember('test1@example.com');

    // 일단 7개의 리뷰를 생성합니다.
    await Promise.all([
      createAndSaveReview(testMember),
      createAndSaveReview(testMember),
      createAndSaveReview(testMember),
      createAndSaveReview(testMember),
      createAndSaveReview(testMember),
      createAndSaveReview(testMember),
      createAndSaveReview(testMember),
    ]);

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    // 실제 로그인 처리 (JWT 획득)
    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];

    // [When] 실제 외부 API 통신을 포함하여 전체 로직 수행
    const response = await request(app.getHttpServer())
      .get('/api/members/mypage/reviews')
      .query({ pageNo: 2, size: 7 }) // 2페이지 요청, 사이즈 5
      .set('authorization', accessToken);

    // [Then] 503 에러가 난다면 여기서 원인 파악을 위해 로그 출력
    if (response.status !== 200) {
      console.log('실제 응답 에러 내용:', response.body);
    }

    expect(response.status).toBe(200);

    const result = response.body as ResponseGetMyReviewWrapper;

    expect(result.totalElements).toBe(7);
    expect(result.content.length).toBe(0);
  });

  //프로필 사진 조회
  it('/api/members/mypage/profile-image (GET) success', async () => {
    //given
    const testMember = await createAndSaveMember('test1@example.com');

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when
    const response = await request(app.getHttpServer())
      .get('/api/members/mypage/profile-image')
      .set('authorization', accessToken)
      .expect(200);

    const result = response.body as ResponseGetMemberProfileImageDto;

    //then
    expect(result.profileImage).toBe('/images/member/profile/default.png');
  });

  //프로필 사진 등록
  it('/api/members/mypage/profile-image (POST) success', async () => {
    //given
    const testMember = await createAndSaveMember('test1@example.com');

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    const testRequest: RequestSetProfileImageDto = {
      profileImage: '/images/test',
    };

    //when & then
    await request(app.getHttpServer())
      .post('/api/members/mypage/profile-image')
      .set('authorization', accessToken)
      .send(testRequest)
      .expect(201);
  });

  //프로필 사진 수정
  it('/api/members/mypage/profile-image (PUT) success', async () => {
    //given
    const testMember = await createAndSaveMember('test1@example.com');

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    const testRequest: RequestSetProfileImageDto = {
      profileImage: '/images/test',
    };

    //when & then
    await request(app.getHttpServer())
      .put('/api/members/mypage/profile-image')
      .set('authorization', accessToken)
      .send(testRequest)
      .expect(204);
  });

  //프로필 사진 삭제
  it('/api/members/mypage/profile-image (DELETE) fail', async () => {
    //given
    const testMember = await createAndSaveMember('test1@example.com');

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when & then
    await request(app.getHttpServer())
      .delete('/api/members/mypage/profile-image')
      .set('authorization', accessToken)
      .expect(404);
  });

  //프로필 사진 삭제
  it('/api/members/mypage/profile-image (DELETE) success', async () => {
    //given
    const testMember = await createTestMember('test1@example.com');
    const member = memberRepository.create(testMember);
    member.profileImage = '/images/test.png';
    await memberRepository.save(member);

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when & then
    await request(app.getHttpServer())
      .delete('/api/members/mypage/profile-image')
      .set('authorization', accessToken)
      .expect(204);

    const result = await memberRepository.findOneBy({
      email: testMember.email,
    });

    expect(result?.profileImage).toBeFalsy();
  });

  //마이페이지 수정 전 비밀번호 확인
  it('/api/members/mypage/password/verify (POST) success', async () => {
    //given
    const testMember = await createAndSaveMember('test1@example.com');

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    const testRequest: ReqeustVerifyPasswordDto = {
      password: 'test1234',
    };

    //when & then
    await request(app.getHttpServer())
      .post('/api/members/mypage/password/verify')
      .set('authorization', accessToken)
      .send(testRequest)
      .expect(200);
  });

  //마이페이지 수정 전 비밀번호 확인
  it('/api/members/mypage/password/verify (POST) fail', async () => {
    //given
    const testMember = await createAndSaveMember('test1@example.com');

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    const testRequest: ReqeustVerifyPasswordDto = {
      password: 'invalid1234',
    };

    //when & then
    await request(app.getHttpServer())
      .post('/api/members/mypage/password/verify')
      .set('authorization', accessToken)
      .send(testRequest)
      .expect(401);
  });

  //비밀번호 수정
  it('/api/members/mypage/password (PUT) success', async () => {
    //given
    const testMember = await createAndSaveMember('test1@example.com');

    const validMember = {
      email: testMember.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    const testRequest: RequestChangePasswordDto = {
      currentPassword: 'test1234',
      newPassword: 'test4321',
    };

    //when & then
    await request(app.getHttpServer())
      .put('/api/members/mypage/password')
      .set('authorization', accessToken)
      .send(testRequest)
      .expect(204);
  });

  //회원가입 시 이메일 중복 확인
  it('/api/members/email-availablity (GET) success', async () => {
    await request(app.getHttpServer())
      .get('/api/members/email-availablity')
      .query('email=valid@example.com')
      .send()
      .expect(200);
  });

  //회원가입 시 이메일 중복 확인
  it('/api/members/email-availablity (GET) fail', async () => {
    const member = await createAndSaveMember('test1@example.com');
    await request(app.getHttpServer())
      .get('/api/members/email-availablity')
      .query('email=' + member.email)
      .send()
      .expect(400);
  });

  //회원가입 시 닉네임 중복 확인
  it('/api/members/nickname-availablity (GET) success', async () => {
    await request(app.getHttpServer())
      .get('/api/members/nickname-availablity')
      .query('nickname=validnickname')
      .send()
      .expect(200);
  });

  //회원가입 시 닉네임 중복 확인
  it('/api/members/nickname-availablity (GET) fail', async () => {
    const testMember = await createAndSaveMember('test1@example.com');
    await request(app.getHttpServer())
      .get('/api/members/nickname-availablity')
      .query('nickname=' + testMember.nickname)
      .send()
      .expect(400);
  });

  //내 활동 조회
  it('/api/members/mypage/summary (GET) success', async () => {
    //테스트 멤버 1개 생성
    const testMember1 = await createAndSaveMember('test1@example.com');
    //테스트 보드 7개 생성
    await Promise.all([
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
    ]);

    //테스트 리뷰 6개 생성
    await Promise.all([
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
    ]);

    const validMember = {
      email: testMember1.email,
      password: 'test1234',
    };

    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send(validMember)
      .expect(200);

    const accessToken = loginResponse.headers['authorization'];
    expect(accessToken).toBeTruthy();

    //when & then
    const response = await request(app.getHttpServer())
      .get('/api/members/mypage/summary')
      .set('authorization', accessToken)
      .expect(200);

    const result = response.body as ResponseGetMemberActivityDto;

    expect(result.boardCount).toBe(7);
    expect(result.reviewCount).toBe(6);
  });
});
