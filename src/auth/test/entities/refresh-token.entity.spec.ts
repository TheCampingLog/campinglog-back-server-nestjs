import { Test, TestingModule } from '@nestjs/testing';
import { TestTypeOrmModule } from 'src/config/test-db.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RefreshToken } from 'src/auth/entities/refresh-token.entity';
import { Member } from 'src/auth/entities/member.entity';
import { createTestMember } from '../fixtures/member.fixture';
import { v4 as uuidv4 } from 'uuid';
import { QueryFailedError } from 'typeorm';
import {
  initializeTransactionalContext,
  StorageDriver,
} from 'typeorm-transactional';

describe('RefreshToken Repository 단위테스트', () => {
  let module: TestingModule;
  let refreshTokenRepository: Repository<RefreshToken>;
  let memberRepository: Repository<Member>;

  beforeAll(async () => {
    initializeTransactionalContext({ storageDriver: StorageDriver.AUTO });

    module = await Test.createTestingModule({
      imports: [
        TestTypeOrmModule(),
        TypeOrmModule.forFeature([Member, RefreshToken]),
      ],
    }).compile();

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

  it('유효한 회원의 이메일 값이면 refresh 토큰 저장 성공', async () => {
    //given
    const testJti = uuidv4();
    const refreshTokenData = refreshTokenRepository.create({
      jti: testJti,
      expiresAt: new Date(),
      member: { email: 'test@example.com' } as Member,
    });

    //when
    await refreshTokenRepository.insert(refreshTokenData);

    const result = await refreshTokenRepository.findOneBy({ jti: testJti });

    //then
    expect(result).toBeTruthy();
    expect(result?.jti).toBe(testJti);
  });

  it('유효한 회원의 Jti 값이면 refresh 토큰 isUsed 1로 수정 성공', async () => {
    //given
    const testJti = 'test';

    //when
    await refreshTokenRepository.update({ jti: testJti }, { used: 1 });

    const result = await refreshTokenRepository.findOneBy({ jti: testJti });

    //then
    expect(result).toBeTruthy();
    expect(result?.used).toBe(1);
  });

  it('유효하지 않은 회원의 이메일 값이면 db에서 에러를 던짐', async () => {
    //given
    const testJti = uuidv4();
    const refreshTokenData = refreshTokenRepository.create({
      jti: testJti,
      expiresAt: new Date(),
      member: { email: 'invalid@example.com' } as Member,
    });

    //when & then
    await expect(() =>
      refreshTokenRepository.insert(refreshTokenData),
    ).rejects.toThrow(QueryFailedError);
  });
});
