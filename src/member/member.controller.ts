import { Controller, Get, Put, HttpCode, UseGuards } from '@nestjs/common';
import { MemberService } from './member.service';
import { AccessAuthGuard } from 'src/auth/passport/access-auth.guard';
import type { JwtData } from 'src/auth/interfaces/jwt.interface';
import { AccessMember } from 'src/auth/decorators/jwt-member.decorator';

@Controller('api/members')
export class MemberController {
  constructor(private readonly memberService: MemberService) {}

  @UseGuards(AccessAuthGuard)
  @Get('/test')
  test(@AccessMember() accessMember: JwtData) {
    return accessMember;
  }

  //회원 승급
  @HttpCode(200)
  @Put('/grade')
  async setMemberGrade() {
    const changed = await this.memberService.updateGradeWeekly();
    return { changed: changed };
  }
}
