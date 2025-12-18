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
import { RequestAddMemberDto } from '../dto/request/request-add-member.dto';
import {
  createTestMember,
  createInvalidTestMember,
} from './fixtures/member.fixture';
import { MemberNotFoundException } from 'src/member/exceptions/member-not-found.exception';

describe('AuthService 단위테스트', () => {
  let authService: AuthService;
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

    authService = module.get<AuthService>(AuthService);
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
  });

  // 회원 탈퇴
  beforeEach(async (): Promise<void> => {
    const testMember = await createTestMember();
    const member = memberRepository.create(testMember);

    await memberRepository.save(member);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await memberRepository.clear();
  });

  it('유효한 회원가입 값이면 회원가입에 성공', async () => {
    //given
    const requestAddMemberDto: RequestAddMemberDto = {
      email: 'test1@example.com',
      password: 'password123',
      name: '홍길동',
      nickname: 'tester',
      birthday: '1990-01-01',
      phoneNumber: '010-1234-5678',
    };

    //when
    const result = await authService.create(requestAddMemberDto);

    //then
    expect(result).toEqual({ message: 'success' });

    const member = await memberRepository.findOneBy({
      email: requestAddMemberDto.email,
    });

    expect(member).toBeInstanceOf(Member);
  });
  // 회원 탈퇴
  it('유효한 멤버의 이메일 값이면 회원 탈퇴 성공', async () => {
    //given
    const validMember = await createTestMember();

    //when
    await authService.deleteMember(validMember.email);

    const result = await memberRepository.findOneBy({
      email: validMember.email,
    });
    //then
    expect(result).toBeFalsy();
  });

  // 회원 탈퇴
  it('유효하지 않은 멤버의 이메일 값이면MemberNotFound 예외를 던짐 ', async () => {
    //given
    const invalidMember = await createInvalidTestMember();

    //when & then
    await expect(authService.deleteMember(invalidMember.email)).rejects.toThrow(
      MemberNotFoundException,
    );
  });
});
