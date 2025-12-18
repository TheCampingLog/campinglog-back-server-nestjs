import { NotFoundException } from '@nestjs/common';
// 회원 탈퇴
export class MemberNotFoundException extends NotFoundException {
  constructor(email: string) {
    super('해당 이메일로 회원을 찾을 수 없습니다. email=' + email);
  }
}
