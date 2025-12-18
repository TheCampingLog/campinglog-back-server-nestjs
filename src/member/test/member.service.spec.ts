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

describe('MemberService 단위테스트', () => {
  let module: TestingModule;
  let memberService: MemberService;
  let memberRepository: Repository<Member>;
  let boardRepository: Repository<Board>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestTypeOrmModule(),
        TypeOrmModule.forFeature([Member, Board, BoardLike, Comment]),
      ],
      providers: [MemberService],
    }).compile();

    memberService = module.get<MemberService>(MemberService);
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
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
});
