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
});
