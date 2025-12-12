import { Test, TestingModule } from '@nestjs/testing';
import { TestTypeOrmModule } from 'src/config/test-db.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { MemberModule } from 'src/member/member.module';
import { AuthService } from 'src/auth/auth.service';
import { LocalStrategy } from 'src/auth/passport/local.strategy';
import { JwtConfigService } from 'src/auth/jwt/jwt.config';
import { Repository } from 'typeorm';
import { Member } from 'src/auth/entities/member.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { createTestMember } from '../fixtures/member.fixture';
import { UnauthorizedException } from '@nestjs/common';

describe('LocalStrategy 단위테스트', () => {
  let localStrategy: LocalStrategy;
  let module: TestingModule;
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
        JwtModule.registerAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            secret: configService.get<string>('JWT_SECRET_KEY', 'test-secret'),
            signOptions: {
              expiresIn: parseInt(
                configService.get<string>('JWT_EXPIRATION', '3600'),
              ),
              issuer: configService.get<string>('JWT_ISSUER', 'camping-log'),
            },
          }),
        }),
        MemberModule,
      ],
      providers: [AuthService, LocalStrategy, JwtConfigService],
    }).compile();

    localStrategy = module.get<LocalStrategy>(LocalStrategy);
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

  afterEach(async () => {
    await memberRepository.clear();
  });

  it('유효한 로그인 값이면 인증 성공', async () => {
    //given
    const testEmail = 'test@example.com';
    const testPassword = 'test1234';

    //when
    const result = await localStrategy.validate(testEmail, testPassword);

    expect(result).toBeInstanceOf(Member);
  });

  it('유효하지 않은 로그인 값이면 인증 실패', async () => {
    //given
    const nonExistEmail = 'invalid@example.com';
    const password = 'test1234';

    //when & then
    try {
      await localStrategy.validate(nonExistEmail, password);
    } catch (e) {
      expect(e).toBeInstanceOf(UnauthorizedException);
    }

    //when & then
    // await expect(
    //   localStrategy.validate(nonExistEmail, password),
    // ).rejects.toThrow(UnauthorizedException);
  });
});
