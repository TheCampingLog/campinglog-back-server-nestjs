import { BadRequestException } from '@nestjs/common';

export class InvalidBoardRequestException extends BadRequestException {
  constructor(message: string = '잘못된 요청입니다.') {
    super(message);
  }
}
