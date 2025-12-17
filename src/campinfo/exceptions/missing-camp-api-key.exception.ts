import { InternalServerErrorException } from '@nestjs/common';

export class MissingCampApiKeyException extends InternalServerErrorException {
  constructor() {
    super('환경변수 CAMP_KEY가 설정되지 않았습니다.');
  }
}
