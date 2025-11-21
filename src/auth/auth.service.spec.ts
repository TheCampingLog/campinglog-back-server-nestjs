import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { Member } from './entities/member.entity';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { RequestAddMemeberDto } from './dto/request/request-add-member.dto';
import { Board } from '../board/entities/board.entity';
import { BoardLike } from '../board/entities/board-like.entity';
import { Comment } from '../board/entities/comment.entity';

describe('AuthService', () => {
  let service: AuthService;
  let memberRepository: Repository<Member>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRoot({
          type: 'sqlite',
          database: ':memory:', // 메모리 DB 사용 (테스트 후 자동 삭제)
          entities: [Member, Board, Comment, BoardLike],
          synchronize: true, // 테스트용으로 자동 스키마 생성
          dropSchema: true, // 테스트 시작 시 스키마 초기화
        }),
        TypeOrmModule.forFeature([Member]),
      ],
      providers: [AuthService],
    }).compile();

    service = module.get<AuthService>(AuthService);
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await memberRepository.clear();
  });

  it('회원 가입 테스트', async () => {
    //given
    const requestAddMemberDto: RequestAddMemeberDto = {
      email: 'test@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: '1990-01-01',
      phoneNumber: '010-1234-5678',
    };

    //when
    const result = await service.create(requestAddMemberDto);

    //then
    expect(result).toEqual({ message: 'success' });
  });
});
