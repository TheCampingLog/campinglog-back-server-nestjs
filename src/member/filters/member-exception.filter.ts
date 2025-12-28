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
  UnauthorizedException,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { MemberNotFoundException } from '../exceptions/member-not-found.exception';
import { DuplicateMemberException } from '../exceptions/duplicate-member.exception';
import { DuplicateNicknameException } from '../exceptions/duplicate-nickname.exception';
import { DuplicatePhoneNumberException } from '../exceptions/duplicate-phone-number.exception';
import { ProfileImageNotFoundException } from '../exceptions/profile-image-not-found.exception';
import { PasswordMissMatchException } from '../exceptions/password-miss-match.exception';
import { InvalidPasswordException } from '../exceptions/invalid-password.exception';
import { DuplicateEmailException } from '../exceptions/duplicate-email.exception';
import { Oauth2AuthenticationException } from '../exceptions/oauth2-authentication.exception';

@Catch()
export class MemberExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(MemberExceptionFilter.name);

  catch(exception: Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const request = ctx.getRequest<Request>();
    const response = ctx.getResponse<Response>();

    let status: HttpStatus;
    let errorCode: string;
    let message: string;

    // 404 - Not Found
    // 회원 탈퇴
    if (
      exception instanceof MemberNotFoundException ||
      exception instanceof ProfileImageNotFoundException ||
      exception instanceof NotFoundException
    ) {
      status = HttpStatus.NOT_FOUND;
      errorCode = 'Member_NOT_FOUND';
      message = exception.message;
      this.logger.error(`Member NotFound: ${message}`);
    }
    // 400 - Bad Request
    // 계정 생성 리팩토링
    // 마이 페이지 정보 수정
    else if (
      exception instanceof Oauth2AuthenticationException ||
      exception instanceof DuplicateMemberException ||
      exception instanceof DuplicateNicknameException ||
      exception instanceof DuplicateEmailException ||
      exception instanceof DuplicatePhoneNumberException ||
      exception instanceof InvalidPasswordException ||
      exception instanceof BadRequestException
    ) {
      status = HttpStatus.BAD_REQUEST;
      errorCode = 'INVALID_REQUEST';
      message = exception.message;
      this.logger.error(`Member BadRequest: ${message}`);
    }
    // 403 - Forbidden
    else if (exception instanceof ForbiddenException) {
      status = HttpStatus.FORBIDDEN;
      errorCode = 'FORBIDDEN';
      message = exception.message;
      this.logger.error(`Member Forbidden: ${message}`);
    }
    // 401 - Unauthorized
    else if (
      exception instanceof PasswordMissMatchException ||
      exception instanceof UnauthorizedException
    ) {
      status = HttpStatus.UNAUTHORIZED;
      errorCode = 'UNAUTHORIZED';
      message = exception.message;
      this.logger.error(`Member Unauthorized: ${message}`);
    }
    // 409 - Conflict
    else if (exception instanceof ConflictException) {
      status = HttpStatus.CONFLICT;
      errorCode = 'ALREADY_LIKED';
      message = exception.message;
      this.logger.error(`Member Conflict: ${message}`);
    }
    // 500 - Internal Server Error (RuntimeException)
    else if (exception instanceof HttpException) {
      status = exception.getStatus();
      errorCode = 'HTTP_EXCEPTION';
      message = exception.message;
      this.logger.error(`Member HttpException: ${message}`);
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      errorCode = 'INTERNAL_SERVER_ERROR';
      message = '멤버 서비스에 오류가 발생했습니다.';
      this.logger.error('Member RuntimeException: ', exception);
    }

    response.status(status).json({
      path: request.url,
      timestamp: new Date().toISOString(),
      error: errorCode,
      message: message,
    });
  }
}
