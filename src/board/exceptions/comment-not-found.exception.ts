import { NotFoundException } from '@nestjs/common';

export class CommentNotFoundException extends NotFoundException {
  constructor(message: string = '댓글을 찾을 수 없습니다.') {
    super(message);
  }
}
