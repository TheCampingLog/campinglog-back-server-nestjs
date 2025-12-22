import { ServiceUnavailableException } from '@nestjs/common';

export class CallCampApiException extends ServiceUnavailableException {
  constructor(mapX: string, mapY: string) {
    super(`외부 API 호출 실패: mapX=${mapX}, mapY=${mapY}`);
  }
}
