import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberService } from '../member/member.service';
import { RequestAddMemeberDto } from './dto/request/request-add-member.dto';
import { Member } from './entities/member.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private readonly memberService: MemberService,
  ) {}

  async create(requestAddMemberDto: RequestAddMemeberDto) {
    const encryptedPassword = await bcrypt.hash(
      requestAddMemberDto.password,
      10,
    );

    const memberData: Member = {
      email: requestAddMemberDto.email,
      password: encryptedPassword,
      name: requestAddMemberDto.name,
      nickname: requestAddMemberDto.nickname,
      birthday: new Date(requestAddMemberDto.birthday),
      phoneNumber: requestAddMemberDto.phoneNumber,
    };

    const member = this.memberRepository.create(memberData);

    await this.memberRepository.save(member);

    return { message: 'success' };
  }

  async validateUser(email: string, password: string): Promise<Member | null> {
    const member = await this.memberService.getMemberByEmail(email);

    if (!member) {
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, member.password);

    if (!isPasswordValid) {
      return null;
    }

    return member;
  }
}
