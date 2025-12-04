import { BadRequestException } from '@nestjs/common';

export class NotLikedException extends BadRequestException {
  constructor(message: string = '좋아요를 누르지 않은 게시글입니다.') {
    super(message);
  }
}
