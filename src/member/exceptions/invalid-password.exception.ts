import { BadRequestException } from '@nestjs/common';
// 회원 탈퇴
export class InvalidPasswordException extends BadRequestException {
  constructor(message: string = '새 비밀번호가 기존 비밀번호와 일치합니다.') {
    super(message);
  }
}
