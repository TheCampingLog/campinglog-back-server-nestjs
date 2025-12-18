import { BadRequestException } from '@nestjs/common';
// 회원 탈퇴
export class DuplicateMemberException extends BadRequestException {
  constructor(message: string = '이미 존재하는 멤버입니다') {
    super(message);
  }
}
