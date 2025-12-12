import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { TestTypeOrmModule } from 'src/config/test-db.module';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/auth/jwt/jwt.config';
import { JwtService } from '@nestjs/jwt';
import { AccessTokenService } from 'src/auth/jwt/access-token.service';
import { createTestMember } from '../fixtures/member.fixture';
import { Member } from 'src/auth/entities/member.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { Repository } from 'typeorm';

describe('AccessTokenService 단위테스트', () => {
  let module: TestingModule;
  let accessTokenService: AccessTokenService;
  let memberRepository: Repository<Member>;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        TestTypeOrmModule(),
        TypeOrmModule.forFeature([Member, RefreshToken]),
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'src/config/env/.dev.env',
        }),
        JwtModule.register({}),
      ],
      providers: [JwtConfigService, JwtService, AccessTokenService],
    }).compile();

    accessTokenService = module.get<AccessTokenService>(AccessTokenService);
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
  });
  beforeEach(async (): Promise<void> => {
    // 테스트 유저 추가
    const testMember = await createTestMember();
    const member = memberRepository.create(testMember);

    await memberRepository.save(member);
  });
  afterAll(async () => {
    await module.close();
  });

  it('유효한 Member라면 access token 발행 성공', async () => {
    //given
    const testMember = await createTestMember();

    //when
    const accessToken = accessTokenService.generateToken(testMember);

    //then
    expect(accessToken).toBeTruthy();
    expect(accessToken.length).toBeGreaterThan(100);
  });

  it('유효한 이메일이라면 access token 발행 성공', async () => {
    //given
    const validEmail = (await createTestMember()).email;

    //when
    const accessToken =
      await accessTokenService.generateTokenByEmail(validEmail);

    //then
    expect(accessToken).toBeTruthy();
    expect(accessToken.length).toBeGreaterThan(100);
  });
});
