import { Test, TestingModule } from '@nestjs/testing';
import { TestTypeOrmModule } from 'src/config/test-db.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { MemberModule } from 'src/member/member.module';
import { AuthService } from '../auth.service';
import { JwtConfigService } from '../jwt/jwt.config';
import { Repository } from 'typeorm';
import { Member } from '../entities/member.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { RequestAddMemeberDto } from '../dto/request/request-add-member.dto';

describe('AuthService 단위테스트', () => {
  let service: AuthService;
  let memberRepository: Repository<Member>;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestTypeOrmModule(),
        TypeOrmModule.forFeature([Member, RefreshToken]),
        PassportModule,
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'src/config/env/.dev.env',
        }),
        MemberModule,
      ],
      providers: [AuthService, JwtConfigService],
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

  it('유효한 회원가입 값이면 회원가입에 성공', async () => {
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

    const member = await memberRepository.findOneBy({
      email: requestAddMemberDto.email,
    });

    expect(member).toBeInstanceOf(Member);
  });
});
