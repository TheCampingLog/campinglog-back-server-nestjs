import { BadRequestException } from '@nestjs/common';
// 마이 페이지 정보 수정
export class DuplicatePhoneNumberException extends BadRequestException {
  constructor(message: string = '이미 사용중인 전화번호입니다') {
    super(message);
  }
}
