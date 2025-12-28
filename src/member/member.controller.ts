import { CampinfoService } from './../campinfo/campinfo.service';
import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
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
import { RequestSetProfileImageDto } from './dto/request/request-set-profile-image.dto';
import { ReqeustVerifyPasswordDto } from './dto/request/request-verify-password.dto';
import { RequestChangePasswordDto } from './dto/request/request-change-password.dto';

@Controller('api/members')
export class MemberController {
  constructor(
    private readonly memberService: MemberService,
    private readonly CampinfoService: CampinfoService,
  ) {}

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
  async getWeeklyRanking(@Query('memberNo') memberNo: number = 5) {
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

  //내가 쓴 글 조회
  @UseGuards(AccessAuthGuard)
  @HttpCode(200)
  @Get('/mypage/boards')
  async getBoards(
    @AccessMember() accessMember: JwtData,
    @Query('pageNo') pageNo: number = 1,
  ) {
    return await this.memberService.getBoards(accessMember.email, pageNo);
  }

  //내가 작성한 댓글 리스트 조회
  @UseGuards(AccessAuthGuard)
  @HttpCode(200)
  @Get('/mypage/comments')
  async getComments(
    @AccessMember() accessMember: JwtData,
    @Query('pageNo') pageNo: number = 1,
  ) {
    return await this.memberService.getComments(accessMember.email, pageNo);
  }

  //내가 작성한 리뷰 리스트 조회
  @UseGuards(AccessAuthGuard)
  @HttpCode(200)
  @Get('/mypage/reviews')
  async getReviews(
    @AccessMember() accessMember: JwtData,
    @Query('pageNo') pageNo: number = 1,
    @Query('size') size: number = 4,
  ) {
    return await this.CampinfoService.getMyReviews(
      accessMember.email,
      pageNo,
      size,
    );
  }

  //  프로필 사진 조회
  @UseGuards(AccessAuthGuard)
  @HttpCode(200)
  @Get('/mypage/profile-image')
  async getProfileImage(@AccessMember() accessMember: JwtData) {
    return await this.memberService.getProfileImage(accessMember.email);
  }

  //프로필 사진 등록
  @UseGuards(AccessAuthGuard)
  @HttpCode(201)
  @Post('/mypage/profile-image')
  async addProfileImage(
    @AccessMember() accessMember: JwtData,
    @Body() requestSetProfileImageDto: RequestSetProfileImageDto,
  ) {
    return await this.memberService.addProfileImage(
      accessMember.email,
      requestSetProfileImageDto,
    );
  }

  // 프로필 사진 수정
  @UseGuards(AccessAuthGuard)
  @HttpCode(204)
  @Put('/mypage/profile-image')
  async setProfileImage(
    @AccessMember() accessMember: JwtData,
    @Body() requestSetProfileImageDto: RequestSetProfileImageDto,
  ) {
    return await this.memberService.setProfileImage(
      accessMember.email,
      requestSetProfileImageDto,
    );
  }

  // 프로필 사진 삭제
  @UseGuards(AccessAuthGuard)
  @HttpCode(204)
  @Delete('/mypage/profile-image')
  async deleteProfileImage(@AccessMember() accessMember: JwtData) {
    return await this.memberService.deleteProfileImage(accessMember.email);
  }

  // 마이페이지 수정 전 비밀번호 확인
  @UseGuards(AccessAuthGuard)
  @HttpCode(200)
  @Post('/mypage/password/verify')
  async verifyPassword(
    @AccessMember() accessMember: JwtData,
    @Body() reqeustVerifyPassword: ReqeustVerifyPasswordDto,
  ) {
    return await this.memberService.verifyPassword(
      accessMember.email,
      reqeustVerifyPassword,
    );
  }

  // 비밀번호 수정
  @UseGuards(AccessAuthGuard)
  @HttpCode(204)
  @Put('/mypage/password')
  async setPassword(
    @AccessMember() accessMember: JwtData,
    @Body() requestChangePasswordDto: RequestChangePasswordDto,
  ) {
    return await this.memberService.setPassword(
      accessMember.email,
      requestChangePasswordDto,
    );
  }

  // 회원 가입시 이메일 중복 확인
  @HttpCode(200)
  @Get('/email-availablity')
  async checkEmailAvailable(@Query('email') email: string) {
    return await this.memberService.checkEmailAvailable(email);
  }

  // 회원 가입시 닉네임 중복 확인
  @HttpCode(200)
  @Get('/nickname-availablity')
  async checkNicknameAvailable(@Query('nickname') nickname: string) {
    return await this.memberService.checkNicknameAvailable(nickname);
  }

  // 내 활동 조회
  @UseGuards(AccessAuthGuard)
  @HttpCode(200)
  @Get('/mypage/summary')
  async getMySummary(@AccessMember() accessMember: JwtData) {
    return await this.memberService.getMemberActivity(accessMember.email);
  }
}
