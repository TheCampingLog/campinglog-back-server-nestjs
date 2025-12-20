import { NotFoundException } from '@nestjs/common';

export class NullReviewException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}
