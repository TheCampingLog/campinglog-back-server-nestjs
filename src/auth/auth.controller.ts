import {
  Controller,
  Post,
  Get,
  Body,
  Delete,
  Response,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import * as Express from 'express';
import { AuthService } from './auth.service';
import { AccessTokenService } from './jwt/access-token.service';
import { RefreshTokenService } from './jwt/refresh-token.service';
import { RequestAddMemberDto } from './dto/request/request-add-member.dto';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AccessAuthGuard } from './passport/access-auth.guard';
import { CurrentMember } from './decorators/current-member.decorator';
import { AccessMember } from './decorators/jwt-member.decorator';
import { Member } from './entities/member.entity';
import { type RefreshData, type JwtData } from './interfaces/jwt.interface';
import { RefreshAuthGuard } from './passport/refresh-auth.guard';
import { RefreshMember } from './decorators/refresh-member.decorator';
import { KakaoAuthGuard } from './passport/kakao-auth.guard';
import { KakaoMember } from './decorators/kakao-member.decorator';
import { type KakaoData } from './interfaces/oauth.interface';
import {
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('auth-rest-controller')
@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  @ApiCreatedResponse({
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  })
  @Post('/api/members')
  async create(@Body() requestAddMemberDto: RequestAddMemberDto) {
    return await this.authService.create(requestAddMemberDto);
  }

  //회원 탈퇴
  @ApiNoContentResponse({
    schema: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
  })
  @UseGuards(AccessAuthGuard)
  @HttpCode(204)
  @Delete('/api/members')
  async deleteMember(@AccessMember() accessMember: JwtData) {
    await this.authService.deleteMember(accessMember.email);
    return;
  }

  @UseGuards(LocalAuthGuard)
  @HttpCode(200)
  @Post('/login')
  async login(
    @CurrentMember() member: Member,
    @Response() res: Express.Response,
  ) {
    const accessToken = this.accessTokenService.generateToken(member);
    const refreshToken = this.refreshTokenService.generateToken(member);

    await this.refreshTokenService.saveRefreshToken(refreshToken);

    res.setHeader('Authorization', `Bearer ${accessToken}`);
    res.cookie('s_rt', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(
        this.configService.get<string>('REFRESH_EXPIRATION', '43200000'),
      ),
    });

    res.json({ message: 'login_success' });
  }

  @UseGuards(RefreshAuthGuard)
  @Get('/api/members/refresh')
  async rotateToken(
    @RefreshMember() refreshData: RefreshData,
    @Response() res: Express.Response,
  ) {
    await this.refreshTokenService.invalidateRefreshToken(refreshData.id);

    const accessToken = await this.accessTokenService.generateTokenByEmail(
      refreshData.sub,
    );
    const refreshToken = this.refreshTokenService.generateTokenByEmail(
      refreshData.sub,
    );

    await this.refreshTokenService.saveRefreshToken(refreshToken);

    res.setHeader('Authorization', `Bearer ${accessToken}`);
    res.cookie('s_rt', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(
        this.configService.get<string>('REFRESH_EXPIRATION', '43200000'),
      ),
    });

    return res.json({ message: 'ok' });
  }

  @Get('/oauth2/authorization/kakao')
  @UseGuards(KakaoAuthGuard)
  kakaoLogin() {}

  @UseGuards(KakaoAuthGuard)
  @Get('/login/oauth2/code/kakao')
  async kakaoCallback(
    @KakaoMember() kakaoMember: KakaoData,
    @Response() res: Express.Response,
  ) {
    const frontendUrl = this.configService.get<string>('FRONTEND_URL');

    await this.authService.processKakaoLogin(kakaoMember);

    const accessToken = await this.accessTokenService.generateTokenByEmail(
      kakaoMember.email as string,
    );

    const refreshToken = this.refreshTokenService.generateTokenByEmail(
      kakaoMember.email as string,
    );

    await this.refreshTokenService.saveRefreshToken(refreshToken);

    res.cookie('s_rt', refreshToken, {
      httpOnly: true,
      maxAge: parseInt(
        this.configService.get<string>('REFRESH_EXPIRATION', '43200000'),
      ),
    });

    res.redirect(`${frontendUrl}/oauth/callback?token=` + accessToken);
  }
}
