import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { LocalStrategy } from './passport/local.strategy';
import { AccessStrategy } from './passport/access.strategy';
import { RefreshStrategy } from './passport/refresh.strategy';
import { JwtConfigService } from './jwt/jwt.config';
import { AccessTokenService } from './jwt/access-token.service';
import { Member } from './entities/member.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { RefreshTokenService } from './jwt/refresh-token.service';
import { MemberModule } from 'src/member/member.module';
import { KakaoStrategy } from './passport/kakao.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({}),
    TypeOrmModule.forFeature([Member, RefreshToken]),
    MemberModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    LocalStrategy,
    AccessStrategy,
    RefreshStrategy,
    KakaoStrategy,
    JwtConfigService,
    AccessTokenService,
    RefreshTokenService,
  ],
})
export class AuthModule {}
