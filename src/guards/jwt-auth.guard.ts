import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Cache } from 'cache-manager';
import { MESSAGE_ERROR } from 'src/constants';
import { IS_PUBLIC_KEY } from 'src/decorators';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const { headers } = context.switchToHttp().getRequest();
    const token = headers?.authorization?.replace('Bearer ', '');

    const jwtValid = await super.canActivate(context);

    if (!token || !jwtValid) {
      return false;
    }
    const tokenExistsInCache = await this.cacheManager.get(`user/${token}`);

    if (tokenExistsInCache) {
      return true;
    }

    throw new UnauthorizedException(MESSAGE_ERROR.HAS_EXPIRED);
  }
}
