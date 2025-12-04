import { NotFoundException } from '@nestjs/common';

export class BoardNotFoundException extends NotFoundException {
  constructor(message: string = '게시글을 찾을 수 없습니다.') {
    super(message);
  }
}
