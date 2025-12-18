import { BadRequestException } from '@nestjs/common';
// 마이 페이지 정보 수정
export class DuplicateEmailException extends BadRequestException {
  constructor(message: string = '이미 사용중인 이메일입니다') {
    super(message);
  }
}
