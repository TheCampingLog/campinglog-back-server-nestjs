import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Board } from './board.entity';
import { Member } from '../../auth/entities/member.entity';
import { BoardLike } from './board-like.entity';
import { Comment } from './comment.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

describe('Board Enrity test', () => {
  let boardRepository: Repository<Board>;
  let memberRepository: Repository<Member>;
  let boardLikeRepository: Repository<BoardLike>;
  let commentRepository: Repository<Comment>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:',
          entities: [Board, Member, BoardLike, Comment, RefreshToken],
          synchronize: true,
          dropSchema: true,
        }),
        TypeOrmModule.forFeature([Board, Member, BoardLike, Comment]),
      ],
    }).compile();

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
    await module.close();
  });

  afterEach(async () => {
    await commentRepository.clear();
    await boardLikeRepository.clear();
    await boardRepository.clear();
    await memberRepository.clear();
  });

  it('Board Entity 생성 테스트', async () => {
    //given
    const member = memberRepository.create({
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: '1990-01-01',
      phoneNumber: '010-1234-5678',
    });
    await memberRepository.save(member);

    const board = boardRepository.create({
      title: '첫 번째 게시글',
      content: '게시글 내용입니다.',
      categoryName: '자유',
      member,
    });
    const savedBoard = await boardRepository.save(board);

    const comment = commentRepository.create({
      content: '첫 번째 댓글입니다.',
      board: savedBoard,
      member,
    });
    await commentRepository.save(comment);

    const boardLike = boardLikeRepository.create({
      board: savedBoard,
      member,
    });
    await boardLikeRepository.save(boardLike);

    const foundBoard = await boardRepository.findOne({
      where: { id: savedBoard.id },
      relations: ['member', 'comments', 'boardLikes'],
    });
    //then
    expect(foundBoard).toBeDefined();
    expect(foundBoard?.member.email).toBe(member.email);
    expect(foundBoard?.comments).toHaveLength(1);
    expect(foundBoard?.boardLikes).toHaveLength(1);

    expect(foundBoard?.getEmail()).toBe(member.email);
    expect(foundBoard?.getNickname()).toBe(member.nickname);
  });
});
