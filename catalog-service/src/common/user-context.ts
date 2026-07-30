import { UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';

export interface UserContext {
  sub: string;
  email?: string;
}

interface AuthenticatedUser {
  sub: string;
  email?: string;
}

export function getUserContext(request: Request): UserContext {
  const user = (request as Request & { user?: AuthenticatedUser }).user;

  if (!user?.sub) {
    throw new UnauthorizedException('Missing authenticated user');
  }

  return {
    sub: user.sub,
    email: user.email,
  };
}
