import { ForbiddenException } from '@nestjs/common';

export class NotYourCommentException extends ForbiddenException {
  constructor(message: string) {
    super(message);
  }
}
