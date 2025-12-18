import {
  Controller,
  Get,
  Put,
  HttpCode,
  Query,
  UseGuards,
  Body,
} from '@nestjs/common';
import { MemberService } from './member.service';
import { AccessAuthGuard } from 'src/auth/passport/access-auth.guard';
import type { JwtData } from 'src/auth/interfaces/jwt.interface';
import { AccessMember } from 'src/auth/decorators/jwt-member.decorator';
import { RequestUpdateMemberDto } from './dto/request/request-update-member.dto';

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

  //회원 랭킹 조회
  @HttpCode(200)
  @Get('/rank')
  async getWeeklyRanking(@Query('memberNo') memberNo: number) {
    return await this.memberService.updateRankWeekly(memberNo);
  }

  //마이 페이지 조회
  @UseGuards(AccessAuthGuard)
  @HttpCode(200)
  @Get('/mypage')
  async getMember(@AccessMember() accessMember: JwtData) {
    return await this.memberService.getMember(accessMember.email);
  }

  //마이 페이지 정보 수정
  @UseGuards(AccessAuthGuard)
  @HttpCode(204)
  @Put('/mypage')
  async setMember(
    @AccessMember() accessMember: JwtData,
    @Body() requestUpdateMemberDto: RequestUpdateMemberDto,
  ) {
    return await this.memberService.setMember(
      accessMember.email,
      requestUpdateMemberDto,
    );
  }
}
