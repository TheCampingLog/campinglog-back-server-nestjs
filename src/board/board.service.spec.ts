import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { Member } from '../auth/entities/member.entity';
import { Comment } from './entities/comment.entity';
import { BoardLike } from './entities/board-like.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { RefreshToken } from '../auth/entities/refresh-token.entity';
import { RequestAddBoardDto } from './dto/request/request-add-board.dto';
import { RequestSetBoardDto } from './dto/request/request-set-board.dto';
import { BoardNotFoundException } from './exceptions/board-not-found.exception';

describe('BoardService', () => {
  let service: BoardService;
  let boardRepository: Repository<Board>;
  let memberRepository: Repository<Member>;
  let boardLikeRepository: Repository<BoardLike>;
  let commentRepository: Repository<Comment>;
  let module: TestingModule | null = null;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Board, Member, Comment, BoardLike, RefreshToken],
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
    boardLikeRepository = module.get<Repository<BoardLike>>(
      getRepositoryToken(BoardLike),
    );
    commentRepository = module.get<Repository<Comment>>(
      getRepositoryToken(Comment),
    );
  });

  afterAll(async () => {
    if (module) {
      await module.close();
    }
  });

  afterEach(async () => {
    await commentRepository.clear();
    await boardLikeRepository.clear();
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

  it('게시글 상세 조회 테스트 - 조회수 증가 확인', async () => {
    // given: 회원 + 게시글 생성
    const member = memberRepository.create({
      email: 'detail@example.com',
      password: 'password123',
      name: '상세조회유저',
      nickname: 'detailUser',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1111-2222',
    });
    await memberRepository.save(member);

    let board = boardRepository.create({
      title: '상세 조회 테스트',
      content: '상세 내용',
      categoryName: 'FREE',
      boardImage: 'test-image.jpg',
      member: member,
      viewCount: 10,
      likeCount: 5,
      commentCount: 3,
    });
    board = await boardRepository.save(board);

    const initialViewCount = board.viewCount;

    // when: 게시글 상세 조회
    const result = await service.getBoardDetail(board.boardId);

    // then: 응답 검증
    expect(result).toBeDefined();
    expect(result.boardId).toBe(board.boardId);
    expect(result.title).toBe(board.title);
    expect(result.content).toBe(board.content);
    expect(result.categoryName).toBe(board.categoryName);
    expect(result.viewCount).toBe(initialViewCount + 1); // 조회수 증가 확인
    expect(result.likeCount).toBe(board.likeCount);
    expect(result.commentCount).toBe(board.commentCount);
    expect(result.boardImage).toBe(board.boardImage);
    expect(result.nickName).toBe(member.nickname);
    expect(result.email).toBe(member.email);
    expect(result.isLiked).toBe(false); // userEmail 없으면 false

    // DB에서 조회수가 실제로 증가했는지 확인
    const updatedBoard = await boardRepository.findOne({
      where: { boardId: board.boardId },
    });
    expect(updatedBoard?.viewCount).toBe(initialViewCount + 1);
  });

  it('게시글 상세 조회 테스트 - 좋아요 누른 경우', async () => {
    // given: 회원 + 게시글 생성
    const member = memberRepository.create({
      email: 'liked@example.com',
      password: 'password123',
      name: '좋아요유저',
      nickname: 'likedUser',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-3333-4444',
    });
    await memberRepository.save(member);

    let board = boardRepository.create({
      title: '좋아요 테스트',
      content: '좋아요 내용',
      categoryName: 'FREE',
      member: member,
      viewCount: 0,
      likeCount: 1,
      commentCount: 0,
    });
    board = await boardRepository.save(board);

    // BoardLike 생성
    const boardLike = boardLikeRepository.create({
      board: board,
      member: member,
    });
    await boardLikeRepository.save(boardLike);

    // when: 좋아요를 누른 사용자로 조회
    const result = await service.getBoardDetail(board.boardId, member.email);

    // then
    expect(result).toBeDefined();
    expect(result.isLiked).toBe(true); // 좋아요 누른 상태
    expect(result.likeCount).toBe(1);
  });

  it('게시글 상세 조회 테스트 - 좋아요 안 누른 경우', async () => {
    // given: 회원 2명 생성
    const owner = memberRepository.create({
      email: 'owner@example.com',
      password: 'password123',
      name: '작성자',
      nickname: 'owner',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-5555-6666',
    });
    await memberRepository.save(owner);

    const viewer = memberRepository.create({
      email: 'viewer@example.com',
      password: 'password123',
      name: '조회자',
      nickname: 'viewer',
      birthday: new Date('1995-05-05'),
      phoneNumber: '010-7777-8888',
    });
    await memberRepository.save(viewer);

    // owner가 작성한 게시글
    let board = boardRepository.create({
      title: '좋아요 없음 테스트',
      content: '내용',
      categoryName: 'FREE',
      member: owner,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    });
    board = await boardRepository.save(board);

    // when: 다른 사용자(viewer)가 조회
    const result = await service.getBoardDetail(board.boardId, viewer.email);

    // then
    expect(result).toBeDefined();
    expect(result.isLiked).toBe(false); // 좋아요 안 누름
    expect(result.email).toBe(owner.email); // 작성자 정보
    expect(result.nickName).toBe(owner.nickname);
  });

  it('게시글 상세 조회 테스트 - 존재하지 않는 게시글', async () => {
    // when & then
    await expect(
      service.getBoardDetail('nonexistent-board-id'),
    ).rejects.toThrow(BoardNotFoundException);
  });

  it('게시글 상세 조회 테스트 - 빈 이메일로 조회', async () => {
    // given: 회원 + 게시글 생성
    const member = memberRepository.create({
      email: 'empty@example.com',
      password: 'password123',
      name: '빈이메일',
      nickname: 'emptyUser',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-9999-0000',
    });
    await memberRepository.save(member);

    let board = boardRepository.create({
      title: '빈 이메일 테스트',
      content: '내용',
      categoryName: 'FREE',
      member: member,
      viewCount: 0,
      likeCount: 0,
      commentCount: 0,
    });
    board = await boardRepository.save(board);

    // when: 빈 이메일로 조회
    const result = await service.getBoardDetail(board.boardId, '');

    // then
    expect(result).toBeDefined();
    expect(result.isLiked).toBe(false); // 빈 이메일이면 좋아요 체크 안 함
  });

  it('카테고리별 게시글 조회 테스트', async () => {
    // given: 회원 생성
    const member = memberRepository.create({
      email: 'category@example.com',
      password: 'password123',
      name: '카테고리유저',
      nickname: 'categoryUser',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1111-2222',
    });
    await memberRepository.save(member);

    // 다양한 카테고리의 게시글 생성 (명시적으로 시간 설정)
    const now = new Date();

    const board1 = boardRepository.create({
      title: 'FREE 게시글 1',
      content: '자유 게시판 내용 1',
      categoryName: 'FREE',
      member: member,
      viewCount: 10,
      likeCount: 5,
      commentCount: 2,
      createdAt: new Date(now.getTime() - 2000), // 2초 전
    });
    await boardRepository.save(board1);

    const board2 = boardRepository.create({
      title: 'FREE 게시글 2',
      content: '자유 게시판 내용 2',
      categoryName: 'FREE',
      member: member,
      viewCount: 20,
      likeCount: 10,
      commentCount: 5,
      createdAt: new Date(now.getTime() - 1000), // 1초 전
    });
    await boardRepository.save(board2);

    const board3 = boardRepository.create({
      title: 'NOTICE 게시글',
      content: '공지사항',
      categoryName: 'NOTICE',
      member: member,
      viewCount: 100,
      likeCount: 50,
      commentCount: 20,
      createdAt: now,
    });
    await boardRepository.save(board3);

    // when: FREE 카테고리 조회
    const result = await service.getBoardsByCategory('FREE', 1, 10);

    // then
    expect(result).toBeDefined();
    expect(result.content).toBeDefined();
    expect(result.content.length).toBe(2); // FREE 게시글 2개
    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.pageNumber).toBe(0); // 0-based
    expect(result.pageSize).toBe(10);
    expect(result.isFirst).toBe(true);
    expect(result.isLast).toBe(true);

    // 모든 게시글이 FREE 카테고리인지 확인
    result.content.forEach((board) => {
      expect(board.categoryName).toBe('FREE');
      expect(board.nickName).toBe('categoryUser');
    });

    // 최신순 정렬 확인 (board2가 나중에 생성되었으므로 먼저 나옴)
    expect(result.content[0].title).toBe('FREE 게시글 2');
    expect(result.content[1].title).toBe('FREE 게시글 1');
  });

  it('카테고리별 게시글 조회 테스트 - 페이징', async () => {
    // given: 회원 생성
    const member = memberRepository.create({
      email: 'categorypaging@example.com',
      password: 'password123',
      name: '페이징유저',
      nickname: 'pagingUser',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-3333-4444',
    });
    await memberRepository.save(member);

    // 5개의 게시글 생성
    const boards: Board[] = [];
    for (let i = 1; i <= 5; i++) {
      const board = boardRepository.create({
        title: `카테고리 테스트 ${i}`,
        content: `내용 ${i}`,
        categoryName: 'FREE',
        member: member,
      });
      boards.push(board);
    }
    await boardRepository.save(boards);

    // when: page=2, size=2로 조회
    const result = await service.getBoardsByCategory('FREE', 2, 2);

    // then
    expect(result.content.length).toBe(2);
    expect(result.totalElements).toBe(5);
    expect(result.totalPages).toBe(3); // 5개를 2개씩 = 3페이지
    expect(result.pageNumber).toBe(1); // 0-based (page 2 = index 1)
    expect(result.pageSize).toBe(2);
    expect(result.isFirst).toBe(false);
    expect(result.isLast).toBe(false);
  });

  it('카테고리별 게시글 조회 테스트 - 빈 결과', async () => {
    // given: 회원 생성
    const member = memberRepository.create({
      email: 'emptycat@example.com',
      password: 'password123',
      name: '빈결과유저',
      nickname: 'emptyUser',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-5555-6666',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      title: '게시글',
      content: '내용',
      categoryName: 'FREE',
      member: member,
    });
    await boardRepository.save(board);

    // when: 존재하지 않는 카테고리 조회
    const result = await service.getBoardsByCategory('NONEXISTENT', 1, 10);

    // then
    expect(result).toBeDefined();
    expect(result.content.length).toBe(0);
    expect(result.totalElements).toBe(0);
    expect(result.totalPages).toBe(0);
  });

  it('카테고리별 게시글 조회 테스트 - 유효성 검증 (page < 1)', async () => {
    // when & then
    await expect(service.getBoardsByCategory('FREE', 0, 3)).rejects.toThrow(
      'page>=1, size>=1 이어야 합니다.',
    );
  });

  it('카테고리별 게시글 조회 테스트 - 유효성 검증 (size < 1)', async () => {
    // when & then
    await expect(service.getBoardsByCategory('FREE', 1, 0)).rejects.toThrow(
      'page>=1, size>=1 이어야 합니다.',
    );
  });

  it('댓글 추가 테스트 - 성공', async () => {
    // given
    const member = memberRepository.create({
      email: 'comment@example.com',
      password: 'password',
      name: '댓글작성자',
      nickname: 'commenter',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-1111-2222',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      title: '테스트 게시글',
      content: '내용',
      categoryName: 'FREE',
      member: member,
    });
    await boardRepository.save(board);

    const dto = {
      content: '댓글 내용입니다.',
      boardId: board.boardId,
      email: member.email,
    };

    // when
    const result = await service.addComment(board.boardId, dto);

    // then
    expect(result).toBeDefined();
    expect(result.content).toBe('댓글 내용입니다.');
    expect(result.commentId).toBeDefined();
    expect(result.getBoardId()).toBe(board.boardId);
    expect(result.getEmail()).toBe(member.email);

    // 댓글 개수 증가 확인
    const updatedBoard = await boardRepository.findOne({
      where: { boardId: board.boardId },
    });
    expect(updatedBoard).toBeDefined();
    expect(updatedBoard!.commentCount).toBe(1);
  });

  it('댓글 추가 테스트 - 존재하지 않는 게시글', async () => {
    // given
    const dto = {
      content: '댓글 내용',
      boardId: 'nonexistent-board-id',
      email: 'test@example.com',
    };

    // when & then
    await expect(
      service.addComment('nonexistent-board-id', dto),
    ).rejects.toThrow('게시글을 찾을 수 없습니다.');
  });

  it('댓글 추가 테스트 - 존재하지 않는 회원', async () => {
    // given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password',
      name: '테스터',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-2222-3333',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      title: '테스트 게시글',
      content: '내용',
      categoryName: 'FREE',
      member: member,
    });
    await boardRepository.save(board);

    const dto = {
      content: '댓글 내용',
      boardId: board.boardId,
      email: 'nonexistent@example.com',
    };

    // when & then
    await expect(service.addComment(board.boardId, dto)).rejects.toThrow(
      '회원을 찾을 수 없습니다.',
    );
  });

  it('댓글 추가 테스트 - 이메일 누락', async () => {
    // given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password',
      name: '테스터',
      nickname: 'tester',
      birthday: new Date('1990-01-01'),
      phoneNumber: '010-3333-4444',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      title: '테스트 게시글',
      content: '내용',
      categoryName: 'FREE',
      member: member,
    });
    await boardRepository.save(board);

    const dto = {
      content: '댓글 내용',
      boardId: board.boardId,
      email: undefined,
    };

    // when & then
    await expect(service.addComment(board.boardId, dto)).rejects.toThrow(
      '이메일이 필요합니다.',
    );
  });
  it('댓글 조회 - 성공', async () => {
    // given
    const member = memberRepository.create({
      email: 'test@test.com',
      password: 'password123',
      nickname: 'tester',
      name: '테스터',
      birthday: '1990-01-01',
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      boardId: 'test-board-id',
      title: '테스트 게시글',
      content: '테스트 내용',
      categoryName: '자유',
      member,
    });
    await boardRepository.save(board);

    const comment1 = commentRepository.create({
      content: '첫 번째 댓글',
      board,
      member,
      createdAt: new Date('2024-01-01T10:00:00'),
    });
    const comment2 = commentRepository.create({
      content: '두 번째 댓글',
      board,
      member,
      createdAt: new Date('2024-01-01T11:00:00'),
    });
    await commentRepository.save([comment1, comment2]);

    // when
    const result = await service.getComments(board.boardId, 1, 3);

    // then
    expect(result.comments).toHaveLength(2);
    expect(result.comments[0].content).toBe('두 번째 댓글'); // 최신순
    expect(result.comments[1].content).toBe('첫 번째 댓글');
    expect(result.totalElements).toBe(2);
    expect(result.totalPages).toBe(1);
    expect(result.currentPage).toBe(1);
    expect(result.size).toBe(3);
  });

  it('댓글 조회 - 페이지네이션', async () => {
    // given
    const member = memberRepository.create({
      email: 'test2@test.com',
      password: 'password123',
      nickname: 'tester2',
      name: '테스터2',
      birthday: '1990-01-01',
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      boardId: 'test-board-id-2',
      title: '테스트 게시글',
      content: '테스트 내용',
      categoryName: '자유',
      member,
    });
    await boardRepository.save(board);

    for (let i = 0; i < 5; i++) {
      const comment = commentRepository.create({
        content: `댓글 ${i}`,
        board,
        member,
        createdAt: new Date(`2024-01-01T${10 + i}:00:00`),
      });
      await commentRepository.save(comment);
    }

    // when
    const result = await service.getComments(board.boardId, 2, 2);

    // then
    expect(result.comments).toHaveLength(2);
    expect(result.totalElements).toBe(5);
    expect(result.totalPages).toBe(3);
    expect(result.currentPage).toBe(2);
    expect(result.size).toBe(2);
  });

  it('댓글 조회 - 존재하지 않는 게시글', async () => {
    // when & then
    await expect(service.getComments('invalid-id', 1, 3)).rejects.toThrow(
      '게시글을 찾을 수 없습니다.',
    );
  });

  it('댓글 조회 - 잘못된 페이지 번호', async () => {
    // given
    const member = memberRepository.create({
      email: 'test3@test.com',
      password: 'password123',
      nickname: 'tester3',
      name: '테스터3',
      birthday: '1990-01-01',
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      boardId: 'test-board-id-3',
      title: '테스트 게시글',
      content: '테스트 내용',
      categoryName: '자유',
      member,
    });
    await boardRepository.save(board);

    // when & then
    await expect(service.getComments(board.boardId, 0, 3)).rejects.toThrow(
      'page>=1, size>=1 이어야 합니다.',
    );
  });
});
