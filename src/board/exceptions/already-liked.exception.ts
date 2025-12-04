import { ConflictException } from '@nestjs/common';

export class AlreadyLikedException extends ConflictException {
  constructor(message: string = '이미 좋아요를 누른 게시글입니다.') {
    super(message);
  }
}
