import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  type AccessTokenPayload,
  type JwtData,
} from '../interfaces/jwt.interface';

export const AccessMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtData => {
    const request = ctx
      .switchToHttp()
      .getRequest<{ user: AccessTokenPayload }>();

    const user = request.user as JwtData | undefined;

    if (!user) {
      throw new Error('No authenticated user');
    }
    return {
      email: request.user.email,
      role: request.user.role,
    };
  },
);
