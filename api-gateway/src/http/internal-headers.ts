import { Request } from 'express';

/** Forward the original Bearer JWT to downstream microservices (Option 2). */
export function forwardAuthorization(request: Request): Record<string, string> {
  const authorization = request.headers.authorization;
  return typeof authorization === 'string' ? { authorization } : {};
}
