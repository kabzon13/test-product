import { createParamDecorator, ExecutionContext } from '@nestjs/common';

import type { AuthedRequest } from './auth.guard';
import type { SessionUser } from './session.service';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): SessionUser =>
    ctx.switchToHttp().getRequest<AuthedRequest>().user,
);
