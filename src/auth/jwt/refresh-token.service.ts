import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from './jwt.config';
import { Member } from '../entities/member.entity';
import { RefreshToken } from '../entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { v4 as uuidv4 } from 'uuid';
import { RefreshTokenPayload } from '../interfaces/jwt.interface';

@Injectable()
export class RefreshTokenService {
  constructor(
    @InjectRepository(RefreshToken)
    private readonly refreshTokenRepository: Repository<RefreshToken>,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
  ) {}

  generateToken(member: Member): string {
    //sub(email), id(uuid), iat, exp
    const refreshTokenPayload = {
      id: uuidv4(),
      sub: member.email,
    };

    const refreshToken = this.jwtService.sign(
      refreshTokenPayload,
      this.jwtConfigService.getRefreshTokenOptions(),
    );

    return refreshToken;
  }

  generateTokenByEmail(email: string): string {
    //sub(email), id(uuid), iat, exp
    const refreshTokenPayload = {
      id: uuidv4(),
      sub: email,
    };

    const refreshToken = this.jwtService.sign(
      refreshTokenPayload,
      this.jwtConfigService.getRefreshTokenOptions(),
    );

    return refreshToken;
  }

  verifyRefreshToken(refreshToken: string): RefreshTokenPayload {
    return this.jwtService.verify(refreshToken, {
      secret: this.jwtConfigService.getRefreshTokenOptions().secret,
    });
  }

  async saveRefreshToken(refreshToken: string): Promise<boolean> {
    const verifiedRefreshToken = this.verifyRefreshToken(refreshToken);

    const refreshTokenData = this.refreshTokenRepository.create({
      jti: verifiedRefreshToken.id,
      expiresAt: new Date(verifiedRefreshToken.exp),
      member: { email: verifiedRefreshToken.sub },
    });

    const savedRefreshToken =
      await this.refreshTokenRepository.insert(refreshTokenData);

    if (!savedRefreshToken) {
      return false;
    }

    return true;
  }

  async invalidateRefreshToken(jti: string): Promise<boolean> {
    const result = await this.refreshTokenRepository.update(
      { jti: jti },
      { used: 1 },
    );

    if (!result.affected) {
      return false;
    }

    return true;
  }
}
