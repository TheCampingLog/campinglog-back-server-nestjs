import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { Member } from '../auth/entities/member.entity';
import { Comment } from './entities/comment.entity';
import { BoardLike } from './entities/board-like.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { RequestAddBoardDto } from './dto/request/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request/request-set-board.dto';

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

  it('게시글 삭제 테스트', async () => {
    // given: 회원 + 게시글 저장
    const member = memberRepository.create({
      email: 'delete@example.com',
      password: 'password123',
      name: '삭제유저',
      nickname: 'deleter',
      birthday: new Date('1992-03-15'),
      phoneNumber: '010-7777-6666',
    });
    await memberRepository.save(member);

    let board = boardRepository.create({
      title: '삭제할 제목',
      content: '삭제할 내용',
      categoryName: 'FREE',
      member: member,
    });
    board = await boardRepository.save(board);
    const boardId = board.boardId;

    // when: 삭제 실행
    await service.deleteBoard(boardId);

    // then: DB에서 조회했을 때 없어야 함
    const deleted = await boardRepository.findOne({
      where: { boardId: boardId },
    });

    expect(deleted).toBeNull();
  });

  it('게시글 검색 테스트 - 키워드와 카테고리로 검색', async () => {
    // given: 회원 생성
    const member = memberRepository.create({
      email: 'search@example.com',
      password: 'password123',
      name: '검색유저',
      nickname: 'searcher',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    // 다양한 게시글 생성
    const board1 = boardRepository.create({
      title: '캠핑 장비 추천',
      content: '텐트 추천합니다',
      categoryName: 'FREE',
      member: member,
      viewCount: 100,
      likeCount: 10,
      commentCount: 5,
    });

    const board2 = boardRepository.create({
      title: '캠핑 요리 레시피',
      content: '맛있는 요리',
      categoryName: 'FREE',
      member: member,
      viewCount: 200,
      likeCount: 20,
      commentCount: 10,
    });

    const board3 = boardRepository.create({
      title: '등산 후기',
      content: '등산 다녀왔어요',
      categoryName: 'NOTICE',
      member: member,
      viewCount: 50,
      likeCount: 5,
      commentCount: 2,
    });

    await boardRepository.save([board1, board2, board3]);

    // when: '캠핑' 키워드로 FREE 카테고리 검색
    const result = await service.searchBoards('캠핑', 'FREE', 1, 10);

    // then
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content.length).toBe(2); // board1, board2
    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.pageNumber).toBe(0); // 0-based
    expect(result.pageSize).toBe(10);
    expect(result.isFirst).toBe(true);
    expect(result.isLast).toBe(true);

    // 최신순 정렬 확인 (board2가 먼저)
    expect(result.content[0].title).toContain('캠핑');
    expect(result.content[0].nickName).toBe('searcher');
    expect(result.content[0].keyword).toBe('캠핑');
  });

  it('게시글 검색 테스트 - 페이징', async () => {
    // given: 회원 생성
    const member = memberRepository.create({
      email: 'paging@example.com',
      password: 'password123',
      name: '페이징유저',
      nickname: 'pager',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    // 5개의 게시글 생성
    const boards: Board[] = [];
    for (let i = 1; i <= 5; i++) {
      const board = boardRepository.create({
        title: `테스트 게시글 ${i}`,
        content: `내용 ${i}`,
        categoryName: 'FREE',
        member: member,
      });
      boards.push(board);
    }
    await boardRepository.save(boards);

    // when: page=2, size=2로 조회
    const result = await service.searchBoards('테스트', 'FREE', 2, 2);

    // then
    expect(result.content.length).toBe(2);
    expect(result.totalElements).toBe(5);
    expect(result.totalPages).toBe(3); // 5개를 2개씩 = 3페이지
    expect(result.pageNumber).toBe(1); // 0-based (page 2 = index 1)
    expect(result.isFirst).toBe(false);
    expect(result.isLast).toBe(false);
  });

  it('게시글 검색 테스트 - 빈 카테고리', async () => {
    // given: 회원 생성
    const member = memberRepository.create({
      email: 'empty@example.com',
      password: 'password123',
      name: '빈카테고리유저',
      nickname: 'empty',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      title: '검색할 게시글',
      content: '내용',
      categoryName: '',
      member: member,
    });
    await boardRepository.save(board);

    // when: 빈 카테고리로 검색
    const result = await service.searchBoards('검색', '', 1, 10);

    // then
    expect(result.content.length).toBe(1);
  });

  it('게시글 검색 테스트 - 유효성 검증 (page < 1)', async () => {
    // when & then
    await expect(service.searchBoards('키워드', 'FREE', 0, 3)).rejects.toThrow(
      'page>=1, size>=1 이어야 합니다.',
    );
  });

  it('게시글 검색 테스트 - 유효성 검증 (size < 1)', async () => {
    // when & then
    await expect(service.searchBoards('키워드', 'FREE', 1, 0)).rejects.toThrow(
      'page>=1, size>=1 이어야 합니다.',
    );
  });
});
