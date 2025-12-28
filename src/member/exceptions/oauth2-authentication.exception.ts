import { BadRequestException } from '@nestjs/common';
// 마이 페이지 정보 수정
export class Oauth2AuthenticationException extends BadRequestException {
  constructor(message: string = '카카오 계정 정보를 가져올 수 없습니다.') {
    super(message);
  }
}
