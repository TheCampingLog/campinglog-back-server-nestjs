import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { JwtConfigService } from 'src/auth/jwt/jwt.config';
import { JwtSignOptions } from '@nestjs/jwt';

describe('JwtConfigService 단위테스트', () => {
  let module: TestingModule;
  let jwtConfigService: JwtConfigService;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: 'src/config/env/.dev.env',
        }),
      ],
      providers: [JwtConfigService],
    }).compile();

    jwtConfigService = module.get<JwtConfigService>(JwtConfigService);
  });

  afterAll(async () => {
    await module.close();
  });

  it('Access 토큰 옵션 함수를 불러오면 필요한 옵션을 반환', () => {
    //when
    const result: JwtSignOptions = jwtConfigService.getAccessTokenOptions();

    //then
    expect(result.secret).toBeTruthy();
    expect(result.expiresIn).toBeTruthy();
    expect(result.issuer).toBeTruthy();
  });

  it('Refresh 토큰 옵션 함수를 불러오면 필요한 옵션을 반환', () => {
    //when
    const result: JwtSignOptions = jwtConfigService.getRefreshTokenOptions();

    //then
    expect(result.secret).toBeTruthy();
    expect(result.expiresIn).toBeTruthy();
  });
});
