import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
  HttpException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { NoExistCampException } from '../exceptions/no-exist-camp.exception';
import { MissingCampApiKeyException } from '../exceptions/missing-camp-api-key.exception';
import { NoSearchResultException } from '../exceptions/no-search-result.exception';
import { InvalidLimitException } from '../exceptions/invalid-limit.exception';
import { CallCampApiException } from '../exceptions/call-camp-api.exception';
import { NullReviewException } from '../exceptions/null-review.exception';

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

    // HttpException 처리 (인증, validation 등)
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      errorCode =
        typeof exceptionResponse === 'object' && 'error' in exceptionResponse
          ? String(exceptionResponse.error)
          : exception.name;
      message = exception.message;
      this.logger.error(`CampInfo HttpException: ${message}`);
    }

    // 400 - Bad Request
    else if (exception instanceof InvalidLimitException) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'INVALID_LIMIT';
      message = exception.message;
      this.logger.error(`CampInfo BadRequest: ${message}`);
    }
    // 404 - Not Found
    else if (
      exception instanceof NullReviewException ||
      exception instanceof NoExistCampException ||
      exception instanceof NoSearchResultException ||
      exception instanceof NotFoundException
    ) {
      status = HttpStatus.NOT_FOUND;
      errorCode = 'CAMPINFO_NOT_FOUND';
      message = exception.message;
      this.logger.error(`CampInfo NotFound: ${message}`);
    }
    // 503 - Service Unavailable (외부 캠핑 API 장애)
    else if (exception instanceof CallCampApiException) {
      status = HttpStatus.SERVICE_UNAVAILABLE;
      errorCode = 'CAMPINFO_SERVICE_UNAVAILABLE';
      message = exception.message;
      this.logger.error(`CampInfo ServiceUnavailable: ${message}`);
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
