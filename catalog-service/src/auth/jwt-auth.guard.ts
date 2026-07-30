import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import { createRemoteJWKSet, jwtVerify, JWTPayload, JWTVerifyOptions } from 'jose';
import { SessionCacheService } from '../cache/session-cache.service';
import { IS_PUBLIC_KEY } from './public.decorator';

interface KeycloakJwtPayload extends JWTPayload {
  sub: string;
  email?: string;
  preferred_username?: string;
  realm_access?: { roles?: string[] };
  resource_access?: Record<string, { roles?: string[] }>;
}

const jwksCache = new Map<string, ReturnType<typeof createRemoteJWKSet>>();

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly reflector: Reflector,
    private readonly sessionCache: SessionCacheService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const token = this.extractBearerToken(request.headers.authorization);

    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }

    if (await this.sessionCache.isBlacklisted(token)) {
      throw new UnauthorizedException('Token has been revoked');
    }

    const cachedUser = await this.sessionCache.getSession(token);
    if (cachedUser) {
      request.user = cachedUser;
      return true;
    }

    try {
      const payload = await this.verifyToken(token);
      const clientId = this.configService.get<string>('KEYCLOAK_CLIENT_ID');
      const realmRoles = payload.realm_access?.roles ?? [];
      const clientRoles = clientId
        ? payload.resource_access?.[clientId]?.roles ?? []
        : [];

      request.user = {
        sub: payload.sub,
        email: payload.email,
        preferredUsername: payload.preferred_username,
        roles: [...new Set([...realmRoles, ...clientRoles])],
      };

      await this.sessionCache.setSession(token, request.user);
      return true;
    } catch {
      throw new UnauthorizedException('Invalid bearer token');
    }
  }

  private extractBearerToken(authorization?: string): string | undefined {
    const [type, token] = authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }

  private async verifyToken(token: string): Promise<KeycloakJwtPayload> {
    const jwksUri = this.configService.get<string>('KEYCLOAK_JWKS_URI');
    const issuer = this.configService.get<string>('KEYCLOAK_ISSUER');
    const audience = this.configService.get<string>('KEYCLOAK_AUDIENCE');

    if (!jwksUri) {
      throw new UnauthorizedException('Keycloak JWKS URI is missing');
    }

    let jwks = jwksCache.get(jwksUri);

    if (!jwks) {
      jwks = createRemoteJWKSet(new URL(jwksUri));
      jwksCache.set(jwksUri, jwks);
    }

    const options: JWTVerifyOptions = {
      issuer,
      ...(audience ? { audience } : {}),
    };

    const { payload } = await jwtVerify(token, jwks, options);
    return payload as KeycloakJwtPayload;
  }
}
