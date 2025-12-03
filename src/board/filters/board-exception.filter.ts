import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { Response } from 'express';
import { BoardNotFoundException } from '../exceptions/board-not-found.exception';
import { CommentNotFoundException } from '../exceptions/comment-not-found.exception';
import { InvalidBoardRequestException } from '../exceptions/invalid-board-request.exception';
import { NotLikedException } from '../exceptions/not-liked.exception';
import { NotYourBoardException } from '../exceptions/not-your-board.exception';
import { AlreadyLikedException } from '../exceptions/already-liked.exception';

@Catch()
export class BoardExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(BoardExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let errorCode: string;
    let message: string;

    // 404 - Not Found
    if (
      exception instanceof BoardNotFoundException ||
      exception instanceof CommentNotFoundException ||
      exception instanceof NotFoundException
    ) {
      status = HttpStatus.NOT_FOUND;
      errorCode = 'BOARD_NOT_FOUND';
      message = exception.message;
      this.logger.error(`Board NotFound: ${message}`);
    }
    // 400 - Bad Request
    else if (
      exception instanceof InvalidBoardRequestException ||
      exception instanceof NotLikedException ||
      exception instanceof BadRequestException
    ) {
      status = HttpStatus.BAD_REQUEST;
      errorCode =
        exception instanceof NotLikedException
          ? 'NOT_LIKED'
          : 'INVALID_REQUEST';
      message = exception.message;
      this.logger.error(`Board BadRequest: ${message}`);
    }
    // 403 - Forbidden
    else if (
      exception instanceof NotYourBoardException ||
      exception instanceof ForbiddenException
    ) {
      status = HttpStatus.FORBIDDEN;
      errorCode = 'FORBIDDEN';
      message = exception.message;
      this.logger.error(`Board Forbidden: ${message}`);
    }
    // 409 - Conflict
    else if (
      exception instanceof AlreadyLikedException ||
      exception instanceof ConflictException
    ) {
      status = HttpStatus.CONFLICT;
      errorCode = 'ALREADY_LIKED';
      message = exception.message;
      this.logger.error(`Board Conflict: ${message}`);
    }
    // 500 - Internal Server Error (RuntimeException)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = 'HTTP_EXCEPTION';
      message = exception.message;
      this.logger.error(`Board HttpException: ${message}`);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = '게시판 서비스에 오류가 발생했습니다.';
      this.logger.error('Board RuntimeException: ', exception);
    }

    response.status(status).json({
      error: errorCode,
      message: message,
      status: status,
    });
  }
}
