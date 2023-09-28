import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'nestjs-prisma';
import { MESSAGE_ERROR } from 'src/constants';
import { ConfigService } from '@nestjs/config';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService, configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('JWT_SECRET') || 'JWT_DEFAULT_SECRET',
    });
  }

  async validate(payload: any): Promise<any> {
    const userId = payload?.userId;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user.isActive) {
      throw new UnauthorizedException(MESSAGE_ERROR.HAS_EXPIRED);
    }

    return user;
  }
}
