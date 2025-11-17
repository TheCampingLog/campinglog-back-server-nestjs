import { Injectable } from '@nestjs/common';
import { RequestAddMemeberDto } from './dto/request/request-add-member.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Member } from './entities/member.entity';
import { Repository } from 'typeorm';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member) private memberRepository: Repository<Member>,
  ) {}

  async create(requestAddMemberDto: RequestAddMemeberDto) {
    const memberData: Member = {
      email: requestAddMemberDto.email,
      password: requestAddMemberDto.password,
      name: requestAddMemberDto.name,
      nickname: requestAddMemberDto.nickname,
      birthday: new Date(requestAddMemberDto.birthday),
      phoneNumber: requestAddMemberDto.phoneNumber,
    };

    const member = this.memberRepository.create(memberData);

    await this.memberRepository.save(member);

    return { message: 'success' };
  }
}
