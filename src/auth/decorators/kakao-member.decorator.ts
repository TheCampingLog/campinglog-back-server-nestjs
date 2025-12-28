import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { KakaoData } from '../interfaces/oauth.interface';

export const KakaoMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): KakaoData => {
    const request = ctx.switchToHttp().getRequest<{ user: KakaoData }>();

    if (!request.user) {
      throw new Error('No authenticated user');
    }

    return {
      email: request.user.email,
      nickname: request.user.nickname,
    };
  },
);
