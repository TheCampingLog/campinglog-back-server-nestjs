import { Test, TestingModule } from '@nestjs/testing';
import { TestTypeOrmModule } from '../../../config/test-db.module';
import { TypeOrmModule, getRepositoryToken } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { Repository } from 'typeorm';
import { AccessStrategy } from '../../passport/access.strategy';
import { Member } from '../../entities/member.entity';
import { RefreshToken } from '../../entities/refresh-token.entity';
import { type JwtData } from '../../../auth/interfaces/jwt.interface';
import { UnauthorizedException } from '@nestjs/common';

describe('AccessStrategy 단위테스트', () => {
  let module: TestingModule;
  let accessStrategy: AccessStrategy;
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
      ],
      providers: [AccessStrategy],
    }).compile();
    accessStrategy = module.get<AccessStrategy>(AccessStrategy);
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

  it('유효한Access 토큰 페이로드 값이면 인증 성공', () => {
    // given
    const validPayload = {
      email: 'test@example.com',
      role: 'USER',
      iat: 1234567890,
      exp: 1234571490,
      iss: 'camping-log',
    }; // 테스트를 위해 any로 캐스팅

    // when & then
    const result: JwtData = accessStrategy.validate(validPayload);

    //then
    expect(result.email).toBe(validPayload.email);
  });

  it('유효하지 않은Access 토큰 페이로드 값이면 예외를 던짐', () => {
    // given
    const invalidPayload = {
      email: 'test@example.com',
      role: '',
      iat: 1234567890,
      exp: 1234571490,
      iss: 'camping-log',
    };

    // when & then
    expect(() => accessStrategy.validate(invalidPayload)).toThrow(
      UnauthorizedException,
    );
  });
});
