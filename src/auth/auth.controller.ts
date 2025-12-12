import {
  Controller,
  Post,
  Get,
  Body,
  Response,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import * as Express from 'express';
import { AuthService } from './auth.service';
import { AccessTokenService } from './jwt/access-token.service';
import { RefreshTokenService } from './jwt/refresh-token.service';
import { RequestAddMemeberDto } from './dto/request/request-add-member.dto';
import { ConfigService } from '@nestjs/config';
import { LocalAuthGuard } from './passport/local-auth.guard';
import { AccessAuthGuard } from './passport/access-auth.guard';
import { CurrentMember } from './decorators/current-member.decorator';
import { AccessMember } from './decorators/jwt-member.decorator';
import { Member } from './entities/member.entity';
import { type RefreshData, type JwtData } from './interfaces/jwt.interface';
import { RefreshAuthGuard } from './passport/refresh-auth.guard';
import { RefreshMember } from './decorators/refresh-member.decorator';

@Controller()
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly accessTokenService: AccessTokenService,
    private readonly refreshTokenService: RefreshTokenService,
    private readonly configService: ConfigService,
  ) {}

  @Post('/api/members')
  async create(@Body() requestAddMemberDto: RequestAddMemeberDto) {
    return await this.authService.create(requestAddMemberDto);
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

    return res.json({ message: 'login_success' });
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

  @UseGuards(AccessAuthGuard)
  @Get('/api/auth/test')
  test(@AccessMember() accessMember: JwtData) {
    return accessMember;
  }

  @Get('/api/auth/noauth')
  noauth() {
    return { messgae: 'noauth' };
  }
}
