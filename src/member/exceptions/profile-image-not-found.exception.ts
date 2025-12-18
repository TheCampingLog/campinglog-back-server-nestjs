import { NotFoundException } from '@nestjs/common';
// 회원 탈퇴
export class ProfileImageNotFoundException extends NotFoundException {
  constructor(email: string) {
    super('프로필 이미지가 존재하지 않습니다. email=' + email);
  }
}
