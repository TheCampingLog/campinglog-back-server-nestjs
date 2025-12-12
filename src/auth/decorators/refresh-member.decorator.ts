import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RefreshData, RefreshTokenPayload } from '../interfaces/jwt.interface';

export const RefreshMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): RefreshData => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: RefreshTokenPayload }>();

    if (!request.user) {
      throw new Error('No authenticated user');
    }
    return {
      id: request.user.id,
      sub: request.user.sub,
    };
  },
);
