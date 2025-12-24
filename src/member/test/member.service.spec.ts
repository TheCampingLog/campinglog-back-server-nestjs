import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from '../member.service';
import { Repository } from 'typeorm';
import { Member } from 'src/auth/entities/member.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Board } from 'src/board/entities/board.entity';
import { BoardLike } from 'src/board/entities/board-like.entity';
import { Comment } from 'src/board/entities/comment.entity';
import { TestTypeOrmModule } from 'src/config/test-db.module';
import { createTestMember } from './fixtures/member.fixture';
import { MemberNotFoundException } from '../exceptions/member-not-found.exception';
import { RequestUpdateMemberDto } from '../dto/request/request-update-member.dto';
import { DuplicateNicknameException } from '../exceptions/duplicate-nickname.exception';
import { DuplicatePhoneNumberException } from '../exceptions/duplicate-phone-number.exception';
import { ProfileImageNotFoundException } from '../exceptions/profile-image-not-found.exception';
import { RequestSetProfileImageDto } from '../dto/request/request-set-profile-image.dto';
import { ReqeustVerifyPasswordDto } from '../dto/request/request-verify-password.dto';
import { RequestChangePasswordDto } from '../dto/request/request-change-password.dto';
import { InvalidPasswordException } from '../exceptions/invalid-password.exception';
import { PasswordMissMatchException } from '../exceptions/password-miss-match.exception';
import { DuplicateEmailException } from '../exceptions/duplicate-email.exception';
import { Review } from 'src/campinfo/entities/review.entity';
import { ResponseGetMemberActivityDto } from '../dto/response/response-get-member-activity.dto';
import * as bcrypt from 'bcrypt';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

describe('MemberService 단위테스트', () => {
  let module: TestingModule;
  let memberService: MemberService;
  let memberRepository: Repository<Member>;
  let boardRepository: Repository<Board>;
  let boardLikeRepository: Repository<BoardLike>;
  let commentRepository: Repository<Comment>;
  let reviewRepository: Repository<Review>;

  beforeAll(async () => {
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    module = await Test.createTestingModule({
      imports: [
        TestTypeOrmModule(),
        TypeOrmModule.forFeature([Member, Board, BoardLike, Comment, Review]),
      ],
      providers: [MemberService],
    }).compile();

    memberService = module.get<MemberService>(MemberService);
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
    boardLikeRepository = module.get<Repository<BoardLike>>(
      getRepositoryToken(BoardLike),
    );
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
    reviewRepository = module.get<Repository<Review>>(
      getRepositoryToken(Review),
    );
  });

  beforeEach(async (): Promise<void> => {
    await createAndSaveMember('test@example.com');
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await memberRepository.clear();
    await boardRepository.clear();
  });

  // 회원 승급
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
      mapX: '123',
      mapY: '123',
      reviewContent: '테스트 리뷰',
      reviewScore: 4,
      member: member,
    });
    const resultReview = await reviewRepository.save(testReview);
    return resultReview;
  };

  it('DB에 존재하는 이메일이면 멤버를 반환', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';

    //when
    const result = await memberService.getMemberByEmail(testEmail);

    //then
    expect(result).toBeInstanceOf(Member);
    expect(result?.email).toBe('test@example.com');
  });

  //마이 페이지 조회
  it('DB에 존재하지 않는 이메일이면 Null을 반환', async (): Promise<void> => {
    //given
    const testEmail = 'nonexist@example.com';

    //when
    const result = await memberService.getMemberByEmail(testEmail);

    //then
    expect(result).toBeNull();
  });

  it('회원의 등급 업데이트(GREEN -> BLUE)', async () => {
    //given
    const board = createTestBoard('test@example.com', 20);

    const savedResult = await boardRepository.save([board]);
    expect(savedResult.length).toBe(1);

    //when
    const result = await memberService.updateGradeWeekly();
    const updatedMember =
      await memberService.getMemberByEmail('test@example.com');

    //then
    expect(result).toBe(1);
    expect(updatedMember?.memberGrade).toBe('BLUE');
  });

  it('회원의 등급 업데이트(GREEN -> RED)', async () => {
    //given
    const board = createTestBoard('test@example.com', 50);

    const savedResult = await boardRepository.save([board]);
    expect(savedResult.length).toBe(1);

    //when
    const result = await memberService.updateGradeWeekly();
    const updatedMember =
      await memberService.getMemberByEmail('test@example.com');

    //then
    expect(result).toBe(1);
    expect(updatedMember?.memberGrade).toBe('RED');
  });

  it('회원의 등급 업데이트(GREEN -> BLACK)', async () => {
    //given
    const board = createTestBoard('test@example.com', 50);

    const savedResult = await boardRepository.save([board]);
    expect(savedResult.length).toBe(1);

    //when
    const result = await memberService.updateGradeWeekly();
    const updatedMember =
      await memberService.getMemberByEmail('test@example.com');

    //then
    expect(result).toBe(1);
    expect(updatedMember?.memberGrade).toBe('RED');
  });

  it('회원의 등급 업데이트 없음(GREEN -> GREEN)', async () => {
    //given
    const board = createTestBoard('test@example.com', 10);

    const savedResult = await boardRepository.save([board]);
    expect(savedResult.length).toBe(1);

    //when
    const result = await memberService.updateGradeWeekly();
    const updatedMember =
      await memberService.getMemberByEmail('test@example.com');

    //then
    expect(result).toBe(0);
    expect(updatedMember?.memberGrade).toBe('GREEN');
  });

  it('회원의 등급 업데이트 없음(회원X)', async () => {
    //given
    await memberRepository.clear();
    //when
    const result = await memberService.updateGradeWeekly();

    //then
    expect(result).toBe(0);
  });

  it('입력한 날짜 사이의 랭킹 검색', async () => {
    //given
    //테스트 멤버 2개 생성
    const testMember1 = await createAndSaveMember('test1@example.com');
    const testMember2 = await createAndSaveMember('test2@example.com');
    //테스트 보드 2개 생성
    const testBoard1 = await createAndSaveBoard(testMember1.email, 10);
    const testBoard2 = await createAndSaveBoard(testMember2.email, 10);
    const testBoard3 = await createAndSaveBoard(testMember2.email, 10);
    //테스트 좋아요 1개씩 생성
    await createAndSaveBoardLike(testMember1, testBoard2);
    await createAndSaveBoardLike(testMember2, testBoard1);
    await createAndSaveBoardLike(testMember2, testBoard3);

    const start = new Date();
    const end = new Date();
    start.setHours(start.getHours() - 1);
    end.setHours(end.getHours() + 1);

    const result = await memberService.findTopMembersByLikeCreatedAt(
      start,
      end,
    );

    expect(result.length).toBe(2);
    expect(result[0].email).toBe('test2@example.com');
  });

  //회원 랭킹 조회
  it('입력한 랭킹 개수만큼 랭킹 검색', async () => {
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

    const result = await memberService.updateRankWeekly(2);

    expect(result.length).toBe(2);
    expect(result[0].email).toBe('test3@example.com');
  });

  //마이 페이지 조회
  it('DB에 존재하는 이메일이면 ResponseGetMemberDto를 반환', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';

    //when
    const result = await memberService.getMember(testEmail);

    //then
    expect(result.email).toBe('test@example.com');
    expect(result.birthday).toBeTruthy();
    expect(result.joinDate).toBeTruthy();
  });

  //마이 페이지 조회
  it('DB에 존재하는 않는 이메일이면 MemberNotFoundException을 던짐', async (): Promise<void> => {
    //given
    const testEmail = 'invalid@example.com';

    //when & then
    await expect(memberService.getMember(testEmail)).rejects.toThrow(
      MemberNotFoundException,
    );
  });

  //마이 페이지 정보 수정
  it('유효한 변경값이면 멤버 정보를 수정', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';
    const testRequest: RequestUpdateMemberDto = {
      nickname: '변경된 닉네임',
      phoneNumber: '010-9876-4321',
    };

    //when
    await memberService.setMember(testEmail, testRequest);
    const result = await memberRepository.findOneBy({ email: testEmail });

    //then
    expect(result!.email).toBe(testEmail);
    expect(result!.nickname).toBe(testRequest.nickname);
    expect(result!.phoneNumber).toBe(testRequest.phoneNumber);
  });

  //마이 페이지 정보 수정
  it('마이페이지 정보 수정시 중복된 닉네임이면 DuplicateNickname 예외 던짐', async (): Promise<void> => {
    //given
    const testMember = await createTestMember('duplicateNickname@example.com');
    testMember.nickname = '중복된 닉네임';
    const member = memberRepository.create(testMember);
    await memberRepository.save(member);

    const testRequest: RequestUpdateMemberDto = {
      nickname: '중복된 닉네임',
      phoneNumber: '010-9876-4321',
    };

    await expect(
      memberService.setMember('test@example.com', testRequest),
    ).rejects.toThrow(DuplicateNicknameException);
  });

  //마이 페이지 정보 수정
  it('마이페이지 정보 수정시 중복된 전화번호이면 DuplicatePhoneNumber 예외 던짐', async (): Promise<void> => {
    //given
    const testMember = await createTestMember(
      'duplicatePhoneNumber@example.com',
    );
    testMember.phoneNumber = '010-9876-4321';
    const member = memberRepository.create(testMember);
    await memberRepository.save(member);

    const testRequest: RequestUpdateMemberDto = {
      nickname: '닉네임',
      phoneNumber: '010-9876-4321',
    };

    await expect(
      memberService.setMember('test@example.com', testRequest),
    ).rejects.toThrow(DuplicatePhoneNumberException);
  });

  //내가 쓴 글 조회
  it('내가 쓴 7개의 게시글을 2페이지 3개 반환', async () => {
    //given
    //테스트 멤버 2개 생성
    const testMember1 = await createAndSaveMember('test1@example.com');
    //테스트 보드 2개 생성
    await Promise.all([
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
      createAndSaveBoard(testMember1.email, 10),
    ]);

    const result = await memberService.getBoards(testMember1.email, 1);

    expect(result.first).toBeTruthy();
    expect(result.totalPages).toBe(2);
  });

  //내가 작성한 댓글 리스트 조회
  it('내가 쓴 7개의 댓글을 2페이지 3개 반환', async () => {
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

    const result = await memberService.getComments(testMember.email, 1);

    expect(result.first).toBeTruthy();
    expect(result.totalPages).toBe(2);
  });

  // 프로필 사진 조회
  it('멤버의 프로필 이미지 값이 null이면 /images/member/profile/default.png 반환', async () => {
    const result = await memberService.getProfileImage('test@example.com');

    expect(result.profileImage).toBe('/images/member/profile/default.png');
  });

  // 프로필 사진 조회
  it('멤버의 프로필 이미지값 /images/member/test.png 반환', async () => {
    const testMember = await createTestMember('test1@example.com');
    testMember.profileImage = '/images/member/test.png';
    const member = memberRepository.create(testMember);
    await memberRepository.save(member);

    const result = await memberService.getProfileImage(testMember.email);

    expect(result.profileImage).toBe('/images/member/test.png');
  });

  // 프로필 사진 등록
  it('멤버의 프로필 이미지를 /images/member/test.png 등록', async () => {
    const testEmail = 'test@example.com';
    const testRequest: RequestSetProfileImageDto = {
      profileImage: '/images/member/test.png}',
    };
    await memberService.addProfileImage(testEmail, testRequest);

    const result = await memberRepository.findOneBy({ email: testEmail });

    expect(result?.profileImage).toBe(testRequest.profileImage);
  });

  // 프로필 사진 수정
  it('멤버의 프로필 이미지를 /images/member/test.png로 수정 ', async () => {
    const testEmail = 'test@example.com';
    const testRequest: RequestSetProfileImageDto = {
      profileImage: '/images/member/test.png}',
    };
    await memberService.setProfileImage(testEmail, testRequest);

    const result = await memberRepository.findOneBy({ email: testEmail });

    expect(result?.profileImage).toBe(testRequest.profileImage);
  });

  // 프로필 사진 삭제
  it('멤버의 프로필 이미지가 null이면 ProfileImageNotFound 예외를 던짐 ', async () => {
    const testEmail = 'test@example.com';

    await expect(memberService.deleteProfileImage(testEmail)).rejects.toThrow(
      ProfileImageNotFoundException,
    );
  });

  // 프로필 사진 삭제
  it('멤버의 프로필 이미지 삭제 ', async () => {
    const testMember = await createTestMember('test1@example.com');
    testMember.profileImage = '/images/member/test.png';
    const member = memberRepository.create(testMember);
    await memberRepository.save(member);

    await memberService.deleteProfileImage(testMember.email);

    const result = await memberRepository.findOneBy({
      email: testMember.email,
    });

    expect(result?.profileImage).toBeFalsy();
  });

  // 비밀번호 수정 전 비밀번호 확인
  it('멤버의 비밀번호와 일치 ', async () => {
    const testEmail = 'test@example.com';
    const testRequest: ReqeustVerifyPasswordDto = {
      password: 'test1234',
    };

    await memberService.verifyPassword(testEmail, testRequest);
  });

  // 비밀번호 수정 전 비밀번호 확인
  it('멤버의 비밀번호와 불일치 ', async () => {
    const testEmail = 'test@example.com';
    const testRequest: ReqeustVerifyPasswordDto = {
      password: 'invalid1234',
    };

    await expect(
      memberService.verifyPassword(testEmail, testRequest),
    ).rejects.toThrow(PasswordMissMatchException);
  });

  //비밀번호 수정
  it('유효하지 않은 비밀번호면 PasswordMissMatch 예외를 던짐', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';
    const testRequest: RequestChangePasswordDto = {
      currentPassword: 'invalid1234',
      newPassword: 'test4321',
    };

    //when
    await expect(
      memberService.setPassword(testEmail, testRequest),
    ).rejects.toThrow(PasswordMissMatchException);
  });

  //비밀번호 수정
  it('새 비밀번호와 현재 비밀번호가 같으면  InvalidPassword 예외를 던짐', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';
    const testRequest: RequestChangePasswordDto = {
      currentPassword: 'test1234',
      newPassword: 'test1234',
    };

    //when
    await expect(
      memberService.setPassword(testEmail, testRequest),
    ).rejects.toThrow(InvalidPasswordException);
  });

  //비밀번호 수정
  it('비밀번호가 정상적으로 변경됨', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';
    const testRequest: RequestChangePasswordDto = {
      currentPassword: 'test1234',
      newPassword: 'test4321',
    };

    await memberService.setPassword(testEmail, testRequest);

    const savedMember = await memberRepository.findOneBy({ email: testEmail });
    const isSame = await bcrypt.compare(
      testRequest.newPassword,
      savedMember?.password as string,
    );

    expect(isSame).toBe(true);
  });

  //회원 가입 시 이메일 중복 확인
  it('중복된 이메일이 아니면 통과', async (): Promise<void> => {
    //given
    const testEmail = 'valid@example.com';

    await memberService.checkEmailAvailable(testEmail);
  });

  //회원 가입 시 이메일 중복 확인
  it('중복된 이메일이면 DuplicateEmailException', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';

    await expect(memberService.checkEmailAvailable(testEmail)).rejects.toThrow(
      DuplicateEmailException,
    );
  });

  //회원 가입 시 닉네임 중복 확인
  it('중복된 닉네임이 아니면 통과', async (): Promise<void> => {
    //given
    const testNickname = 'valid';

    await memberService.checkNicknameAvailable(testNickname);
  });

  //회원 가입 시 닉네임 중복 확인
  it('중복된 닉네임이면 DuplicateEmailException', async (): Promise<void> => {
    //given
    const testNickname = 'testnickname';

    await expect(
      memberService.checkNicknameAvailable(testNickname),
    ).rejects.toThrow(DuplicateNicknameException);
  });

  //내가 활동 조회
  it('멤버의 활동 기록을 반환', async () => {
    //given
    //테스트 멤버 2개 생성
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

    await Promise.all([
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
      createAndSaveReview(testMember1),
    ]);

    const result: ResponseGetMemberActivityDto =
      await memberService.getMemberActivity(testMember1.email);
    expect(result.boardCount).toBe(7);
    expect(result.reviewCount).toBe(6);
  });
});
