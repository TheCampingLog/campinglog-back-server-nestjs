import { NotFoundException } from '@nestjs/common';

export class NoSearchResultException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}
