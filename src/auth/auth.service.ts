import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MemberService } from '../member/member.service';
import { RequestAddMemberDto } from './dto/request/request-add-member.dto';
import { Member } from './entities/member.entity';
import * as bcrypt from 'bcrypt';
import { MemberNotFoundException } from 'src/member/exceptions/member-not-found.exception';
import { Transactional } from 'typeorm-transactional';
import { KakaoData } from './interfaces/oauth.interface';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Member)
    private readonly memberRepository: Repository<Member>,
    private readonly memberService: MemberService,
  ) {}

  async create(requestAddMemberDto: RequestAddMemberDto) {
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

  async processKakaoLogin(kakaoMember: KakaoData): Promise<void> {
    const member = await this.memberRepository.findOneBy({
      email: kakaoMember.email,
    });

    if (!member) {
      const encryptedPassword = await bcrypt.hash(uuidv4(), 10);

      const memberData: Member = {
        email: kakaoMember.email as string,
        password: encryptedPassword,
        name: kakaoMember.nickname as string,
        nickname: (kakaoMember.nickname as string) + uuidv4().substring(0, 5),
        birthday: new Date(),
        phoneNumber: '010-0000-0000',
        oauth: true,
      };

      const savedMember = this.memberRepository.create(memberData);

      await this.memberRepository.save(savedMember);
    } else {
      if (!member.oauth) {
        member.oauth = true;
        await this.memberRepository.save(member);
      }
    }
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

  //회원 탈퇴
  @Transactional()
  async deleteMember(email: string): Promise<void> {
    const member = await this.memberRepository.findOne({
      where: { email },
      relations: ['boards', 'comments', 'board_like', 'refresh_tokens'],
    });

    if (!member) {
      throw new MemberNotFoundException(email);
    }

    await this.memberRepository.remove(member);
  }
}
