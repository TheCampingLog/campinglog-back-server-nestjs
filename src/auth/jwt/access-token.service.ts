import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { JwtConfigService } from './jwt.config';
import { Member } from '../entities/member.entity';

@Injectable()
export class AccessTokenService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private readonly jwtService: JwtService,
    private readonly jwtConfigService: JwtConfigService,
  ) {}

  generateToken(member: Member): string {
    const accessTokenPayload = {
      email: member.email,
      role: member.role,
    };

    const accessToken = this.jwtService.sign(
      accessTokenPayload,
      this.jwtConfigService.getAccessTokenOptions(),
    );

    return accessToken;
  }

  async generateTokenByEmail(email: string) {
    const member = await this.memberRepository.findOneBy({ email });

    if (!member) {
      throw new NotFoundException();
    }

    return this.generateToken(member);
  }
}
