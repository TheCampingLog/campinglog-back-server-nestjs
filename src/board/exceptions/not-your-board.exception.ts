import { ForbiddenException } from '@nestjs/common';

export class NotYourBoardException extends ForbiddenException {
  constructor(message: string = '본인의 게시글만 수정/삭제할 수 있습니다.') {
    super(message);
  }
}
