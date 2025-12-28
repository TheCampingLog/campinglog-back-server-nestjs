import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';

@Injectable()
export class KakaoAuthGuard extends AuthGuard('kakao') {
  canActivate(context: ExecutionContext) {
    const request: Request = context.switchToHttp().getRequest();

    if (request.url.startsWith('/api-docs')) {
      return true;
    }
    return super.canActivate(context);
  }
}
