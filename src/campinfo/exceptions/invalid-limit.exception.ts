import { BadRequestException } from '@nestjs/common';

export class InvalidLimitException extends BadRequestException {
  constructor(message: string) {
    super(message);
  }
}
