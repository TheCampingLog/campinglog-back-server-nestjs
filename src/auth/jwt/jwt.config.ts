import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtSignOptions } from '@nestjs/jwt';

@Injectable()
export class JwtConfigService {
  constructor(private readonly configService: ConfigService) {}

  getAccessTokenOptions(): JwtSignOptions {
    return {
      secret: this.configService.get<string>('JWT_SECRET_KEY'),
      expiresIn: parseInt(
        this.configService.get<string>('JWT_EXPIRATION', '3600'),
      ),
      issuer: this.configService.get<string>('JWT_ISSUER', 'camping-log'),
    };
  }

  getRefreshTokenOptions(): JwtSignOptions {
    return {
      secret: this.configService.get<string>('REFRESH_SECRET_KEY'),
      expiresIn: parseInt(
        this.configService.get<string>('REFRESH_EXPIRATION', '43200000'),
      ),
    };
  }
}
