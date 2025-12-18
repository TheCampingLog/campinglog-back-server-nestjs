import { Test, TestingModule } from '@nestjs/testing';
import { MemberService } from './member.service';
import { Repository } from 'typeorm';
import { Member } from '../auth/entities/member.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Board } from '../board/entities/board.entity';
import { BoardLike } from '../board/entities/board-like.entity';
import { Comment } from '../board/entities/comment.entity';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { Review } from 'src/campinfo/entities/review.entity';

describe('MemberService 단위테스트', () => {
  let memberService: MemberService;
  let memberRepository: Repository<Member>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:', // 메모리 DB 사용 (테스트 후 자동 삭제)
          entities: [Member, Board, Comment, BoardLike, RefreshToken, Review],
          synchronize: true, // 테스트용으로 자동 스키마 생성
          dropSchema: true, // 테스트 시작 시 스키마 초기화
        }),
        TypeOrmModule.forFeature([Member]),
      ],
      providers: [MemberService],
    }).compile();

    memberService = module.get<MemberService>(MemberService);
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
  });

  beforeEach(async (): Promise<void> => {
    // 테스트 유저 추가
    const testMember = {
      email: 'test@example.com',
      password: 'test1234',
      name: 'choi',
      nickname: 'testnickname',
      birthday: new Date(2002, 8, 20),
      phoneNumber: '010-1234-1234',
    };

    const member = memberRepository.create(testMember);

    await memberRepository.save(member);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await memberRepository.clear();
  });

  it('DB에 존재하는 이메일이면 멤버를 반환한다', async (): Promise<void> => {
    //given
    const testEmail = 'test@example.com';

    //when
    const result = await memberService.getMemberByEmail(testEmail);

    //then
    expect(result).toBeInstanceOf(Member);
    expect(result?.email).toBe('test@example.com');
  });

  it('DB에 존재하지 않는 이메일이면 Null을 반환한다', async (): Promise<void> => {
    //given
    const testEmail = 'nonexist@example.com';

    //when
    const result = await memberService.getMemberByEmail(testEmail);

    //then
    expect(result).toBeNull();
  });
});
