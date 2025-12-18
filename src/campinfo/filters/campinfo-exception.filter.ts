import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NoExistCampException } from '../exceptions/no-exist-camp.exception';
import { MissingCampApiKeyException } from '../exceptions/missing-camp-api-key.exception';
import { NoSearchResultException } from '../exceptions/no-search-result.exception';
import { InvalidLimitException } from '../exceptions/invalid-limit.exception';
@Catch()
export class CampInfoExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(CampInfoExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let errorCode: string;
    let message: string;

    // 400 - Bad Request
    if (exception instanceof InvalidLimitException) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'INVALID_LIMIT';
      message = exception.message;
      this.logger.error(`CampInfo BadRequest: ${message}`);
    }
    // 404 - Not Found
    else if (
      exception instanceof NoExistCampException ||
      exception instanceof NoSearchResultException ||
      exception instanceof NotFoundException
    ) {
      status = HttpStatus.NOT_FOUND;
      errorCode = 'CAMPINFO_NOT_FOUND';
      message = exception.message;
      this.logger.error(`CampInfo NotFound: ${message}`);
    }
    // 500 - Internal Server Error (RuntimeException)
    else if (exception instanceof MissingCampApiKeyException) {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'CAMPINFO_MISSING_API_KEY';
      message = exception.message;
      this.logger.error(`CampInfo Config Error: ${message}`);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = '캠핑 정보 불러오기에 오류가 발생했습니다.';
      this.logger.error('CampInfo RuntimeException: ', exception);
    }
    response.status(status).json({
      path: request.url,
      timestamp: new Date().toISOString(),
      error: errorCode,
      message: message,
    });
  }
}
