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
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';
import { KakaoStrategy } from 'src/auth/passport/kakao.strategy';
import { Profile } from 'passport-kakao';
import { AuthModule } from 'src/auth/auth.module';
import { KakaoData } from 'src/auth/interfaces/oauth.interface';
import { Oauth2AuthenticationException } from 'src/member/exceptions/oauth2-authentication.exception';

describe('KakaoStrategy 단위테스트', () => {
  let kakaoStrategy: KakaoStrategy;
  let module: TestingModule;
  let memberRepository: Repository<Member>;

  beforeAll(async () => {
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

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
        AuthModule,
      ],
      providers: [AuthService, LocalStrategy, JwtConfigService],
    }).compile();

    kakaoStrategy = module.get<KakaoStrategy>(KakaoStrategy);
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

  it('유효한 profile 값이면 이메일과 닉네임 반환', async () => {
    const accessToken = 'testAccessToken';
    const refreshToken = 'testAccessToken';
    const profile: Profile = {
      provider: 'kakao',
      id: 'testId',
      displayName: 'testName',
      username: 'testName',
      _raw: 'testRaw',
      _json: {
        id: 12312,
        kakao_account: {
          email: 'test@example.com',
          profile: {
            email: 'test@example.com',
            nickname: '테스트',
          },
        },
      },
    };

    const result: KakaoData = await new Promise((resolve, reject) => {
      kakaoStrategy.validate(
        accessToken,
        refreshToken,
        profile,
        (error: Error, user: KakaoData) => {
          if (error) {
            reject(error);
          } else {
            resolve(user);
          }
        },
      );
    });

    expect(result.email).toBe('test@example.com');
    expect(result.nickname).toBe('테스트');
  });

  it('kakao_account가 null 값이면 Oauth2Authentication 예외 던짐', async () => {
    const accessToken = 'testAccessToken';
    const refreshToken = 'testAccessToken';
    const EmptyProfile: Profile = {
      provider: '',
      id: '',
      displayName: '',
      username: 'testName',
      _raw: '',
      _json: {},
    };

    await expect(
      new Promise((resolve, reject) => {
        kakaoStrategy.validate(
          accessToken,
          refreshToken,
          EmptyProfile,
          (error: Error, user: KakaoData) => {
            if (error) {
              reject(error);
            } else {
              resolve(user);
            }
          },
        );
      }),
    ).rejects.toThrow(Oauth2AuthenticationException);
  });
});
