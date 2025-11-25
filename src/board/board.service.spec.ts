import { Test, TestingModule } from '@nestjs/testing';
import { BoardService } from './board.service';
import { Repository } from 'typeorm';
import { Board } from './entities/board.entity';
import { Member } from '../auth/entities/member.entity';
import { Comment } from './entities/comment.entity';
import { BoardLike } from './entities/board-like.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { RequestAddBoardDto } from './dto/request-add-board.dto';

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
});
