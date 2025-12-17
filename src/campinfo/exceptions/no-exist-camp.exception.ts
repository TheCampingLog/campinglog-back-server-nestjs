import { NotFoundException } from '@nestjs/common';

export class NoExistCampException extends NotFoundException {
  constructor(message: string) {
    super(message);
  }
}
