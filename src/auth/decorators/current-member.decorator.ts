import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Member } from '../entities/member.entity';

export const CurrentMember = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): Member => {
    const request = ctx.switchToHttp().getRequest<{ user: Member }>();
    return request.user;
  },
);
