import { Test, TestingModule } from '@nestjs/testing';
import { TestTypeOrmModule } from 'src/config/test-db.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { JwtConfigService } from 'src/auth/jwt/jwt.config';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokenService } from 'src/auth/jwt/refresh-token.service';
import { Member } from 'src/auth/entities/member.entity';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import {
  createTestMember,
  createInvalidTestMember,
} from '../fixtures/member.fixture';
import { QueryFailedError } from 'typeorm';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

describe('RefreshTokenService 단위 테스트', () => {
  let module: TestingModule;
  let refreshTokenService: RefreshTokenService;
  let refreshTokenRepository: Repository<RefreshToken>;
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
        JwtModule.register({}),
      ],
      providers: [JwtConfigService, JwtService, RefreshTokenService],
    }).compile();
    refreshTokenService = module.get<RefreshTokenService>(RefreshTokenService);
    refreshTokenRepository = module.get<Repository<RefreshToken>>(
      getRepositoryToken(RefreshToken),
    );
    memberRepository = module.get<Repository<Member>>(
      getRepositoryToken(Member),
    );
  });

  beforeEach(async (): Promise<void> => {
    // 테스트 유저 추가
    const testMember = await createTestMember();
    const member = memberRepository.create(testMember);
    const refreshTokenData = refreshTokenRepository.create({
      jti: 'test',
      expiresAt: new Date(),
      member: { email: 'test@example.com' } as Member,
    });

    await memberRepository.save(member);
    const testRefreshTokenData =
      refreshTokenRepository.create(refreshTokenData);
    await refreshTokenRepository.insert(testRefreshTokenData);
  });

  afterAll(async () => {
    await module.close();
  });

  afterEach(async () => {
    await refreshTokenRepository.clear();
    await memberRepository.clear();
  });

  it('유효한 Member라면 refresh 토큰 발행 성공', async () => {
    //given
    const testMember = await createTestMember();

    //when
    const refreshToken = refreshTokenService.generateToken(testMember);

    //then
    expect(refreshToken).toBeTruthy();
    expect(refreshToken.length).toBeGreaterThan(100);
  });

  it('유효한 email이라면 refresh 토큰 발행 성공', async () => {
    //given
    const testMember = await createTestMember();

    //when
    const refreshToken = refreshTokenService.generateTokenByEmail(
      testMember.email,
    );

    //then
    expect(refreshToken).toBeTruthy();
    expect(refreshToken.length).toBeGreaterThan(100);
  });

  it('유효한 refresh 토큰이라면 분해 성공', async () => {
    //given
    const testMember = await createTestMember();
    const refreshToken = refreshTokenService.generateToken(testMember);

    //when
    const decodedRefreshToken =
      refreshTokenService.verifyRefreshToken(refreshToken);

    //then
    expect(decodedRefreshToken).toBeTruthy();
    expect(decodedRefreshToken.id).toBeTruthy();
    expect(decodedRefreshToken.sub).toBeTruthy();
  });

  it('유효한 refresh 토큰이라면 db에 저장 성공', async () => {
    //given
    const testMember = await createTestMember();
    const refreshToken = refreshTokenService.generateToken(testMember);

    //when
    const result = refreshTokenService.saveRefreshToken(refreshToken);

    //then
    expect(result).toBeTruthy();
  });

  it('탈퇴한 회원의 refresh 토큰이라면 db에서 예외를 던짐 ', async () => {
    //given
    const testMember = await createInvalidTestMember();
    const refreshToken = refreshTokenService.generateToken(testMember);

    //when & then
    await expect(() =>
      refreshTokenService.saveRefreshToken(refreshToken),
    ).rejects.toThrow(QueryFailedError);
  });

  it('유효한 refresh 토큰이라면 db에 used 수정 성공', async () => {
    const testJti = 'test';
    //when
    const result = await refreshTokenService.invalidateRefreshToken(testJti);

    //then
    expect(result).toBe(true);
  });

  it('유효하지 않은 refresh 토큰이라면 used 수정 실패 ', async () => {
    const testJti = 'invalid';
    //when
    const result = await refreshTokenService.invalidateRefreshToken(testJti);

    //then
    expect(result).toBe(false);
  });
});
