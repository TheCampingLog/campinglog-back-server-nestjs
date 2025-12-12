import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  type JwtData,
  type AccessTokenPayload,
} from '../interfaces/jwt.interface';

@Injectable()
export class AccessStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  constructor(readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET_KEY') as string;

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  validate(payload: AccessTokenPayload): JwtData {
    if (!payload.email) {
      throw new UnauthorizedException();
    }

    if (!payload.role) {
      throw new UnauthorizedException();
    }

    return {
      email: payload.email,
      role: payload.role,
    };
  }
}
