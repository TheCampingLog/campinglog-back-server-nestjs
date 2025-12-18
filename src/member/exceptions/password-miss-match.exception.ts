import { UnauthorizedException } from '@nestjs/common';
// 회원 탈퇴
export class PasswordMissMatchException extends UnauthorizedException {
  constructor(message: string = '비밀번호가 일치하지 않습니다.') {
    super(message);
  }
}
