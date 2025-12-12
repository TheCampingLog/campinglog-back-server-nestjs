import { Injectable } from '@nestjs/common';
import { Member } from '../auth/entities/member.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MemberService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
  ) {}

  async getMemberByEmail(email: string): Promise<Member | null> {
    return await this.memberRepository.findOneBy({ email });
  }
}
