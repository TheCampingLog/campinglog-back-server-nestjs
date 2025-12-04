import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { Member } from '../auth/entities/member.entity';
import { Comment } from './entities/comment.entity';
import { BoardLike } from './entities/board-like.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { RequestAddBoardDto } from './dto/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request-set-board.dto';

describe('BoardService', () => {
  let service: BoardService;
  let boardRepository: Repository<Board>;
  let memberRepository: Repository<Member>;
  let module: TestingModule | null = null;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Board, Member, Comment, BoardLike],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Board, Member, Comment, BoardLike]),
      ],
      providers: [BoardService],
    }).compile();

    service = module.get<BoardService>(BoardService);
    boardRepository = module.get<Repository<Board>>(getRepositoryToken(Board));
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  afterEach(async () => {
    await boardRepository.clear();
    await memberRepository.clear();
  });

  it('게시글 등록 테스트', async () => {
    // given: 회원 저장
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const dto: RequestAddBoardDto = {
      title: '제목 테스트',
      content: '내용 테스트',
      categoryName: 'FREE',
      boardImage: 'default',
      email: member.email,
    };

    // when
    const savedBoard = await service.addBoard(dto);

    // then
    expect(savedBoard).toBeDefined();
    expect(savedBoard.id).toBeDefined();
    expect(savedBoard.boardId).toBeDefined();
    expect(savedBoard.title).toBe(dto.title);
    expect(savedBoard.member.email).toBe(dto.email);
  });
  it('게시글 수정 테스트', async () => {
    // given: 회원 + 초기 게시글 저장
    const member = memberRepository.create({
      email: 'update@example.com',
      password: 'password123',
      name: '수정유저',
      nickname: 'updater',
      birthday: new Date('1995-05-05'),
      phoneNumber: '010-9999-8888',
    });
    await memberRepository.save(member);

    let board = boardRepository.create({
      title: '기존 제목',
      content: '기존 내용',
      categoryName: 'FREE',
      boardImage: 'before-image',
      member: member,
    });
    board = await boardRepository.save(board);

    const dto: RequestSetBoardDto = {
      boardId: board.boardId, // 수정 대상
      title: '수정된 제목',
      content: '수정된 내용',
      categoryName: 'NOTICE',
      boardImage: 'after-image',
      email: member.email, // 본인 글
    };

    // when
    await service.setBoard(dto);

    // then: DB에서 다시 조회해서 값이 바뀌었는지 확인
    const updated = await boardRepository.findOne({
      where: { id: board.id },
      relations: ['member'],
    });

    expect(updated).toBeDefined();
    expect(updated!.title).toBe(dto.title);
    expect(updated!.content).toBe(dto.content);
    expect(updated!.categoryName).toBe(dto.categoryName);
    expect(updated!.boardImage).toBe(dto.boardImage);
    expect(updated!.member.email).toBe(member.email);
  });

  it('게시글 랭킹 조회 테스트', async () => {
    // given: 회원 생성
    const member = memberRepository.create({
      email: 'rank@example.com',
      password: 'password123',
      name: '랭킹유저',
      nickname: 'ranker',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1111-2222',
    });
    await memberRepository.save(member);

    // 1주일 이내 게시글 3개 생성 (rank, viewCount 다르게)
    const board1 = boardRepository.create({
      title: '랭킹 1위',
      content: '내용1',
      categoryName: 'FREE',
      member: member,
      rank: 100,
      viewCount: 1000,
      createdAt: new Date(), // 현재 시간
    });

    const board2 = boardRepository.create({
      title: '랭킹 2위',
      content: '내용2',
      categoryName: 'FREE',
      member: member,
      rank: 80,
      viewCount: 800,
      createdAt: new Date(),
    });

    const board3 = boardRepository.create({
      title: '랭킹 3위',
      content: '내용3',
      categoryName: 'FREE',
      member: member,
      rank: 60,
      viewCount: 600,
      createdAt: new Date(),
    });

    // 1주일 이전 게시글 (조회되지 않아야 함)
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 8); // 8일 전

    const oldBoard = boardRepository.create({
      title: '오래된 게시글',
      content: '내용',
      categoryName: 'FREE',
      member: member,
      rank: 200,
      viewCount: 2000,
      createdAt: oldDate,
    });

    await boardRepository.save([board1, board2, board3, oldBoard]);

    // when: limit 2로 조회
    const result = await service.getBoardRank(2);

    // then
    expect(result).toBeDefined();
    expect(result.length).toBe(2); // limit 2
    expect(result[0].title).toBe('랭킹 1위'); // rank 높은 순
    expect(result[0].rank).toBe(100);
    expect(result[0].nickname).toBe('ranker');
    expect(result[1].title).toBe('랭킹 2위');
    expect(result[1].rank).toBe(80);

    // 오래된 게시글은 포함되지 않음
    const oldBoardInResult = result.find((b) => b.title === '오래된 게시글');
    expect(oldBoardInResult).toBeUndefined();
  });

  it('게시글 랭킹 조회 - limit 검증 테스트', async () => {
    // when & then: limit가 1 미만이면 예외 발생
    await expect(service.getBoardRank(0)).rejects.toThrow(
      'limit는 1 이상이어야 합니다.',
    );
    await expect(service.getBoardRank(-1)).rejects.toThrow(
      'limit는 1 이상이어야 합니다.',
    );
  });
});
