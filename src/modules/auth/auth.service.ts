import {
  Injectable,
  UnprocessableEntityException,
  BadRequestException,
  Inject,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { PrismaService } from 'nestjs-prisma';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { MESSAGE_ERROR, SECONDS_OF_DAY } from 'src/constants';
import { RegisterDto } from './dto/register.dto';
import { v4 as uuidv4 } from 'uuid';
import { UserEntity } from 'src/entities';
import dayjs from 'dayjs';
@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private prisma: PrismaService,
    private userService: UsersService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async getProfile(currentUser: UserEntity) {
    try {
      const result = await this.prisma.user.update({
        where: { id: currentUser.id },
        data: { lastSeen: dayjs().toISOString() },
        select: {
          id: true,
          email: true,
          username: true,
          displayName: true,
          phone: true,
          isActive: true,
          role: true,
          thumbnail: true,
          lastSeen: true,
          policy: true,
        },
      });

      return new UserEntity(result);
    } catch (e) {
      console.log(e);
      throw new UnprocessableEntityException(e.messsage);
    }
  }

  async login(credentials: LoginDto) {
    try {
      const { username, password } = credentials;
      const user = await this.prisma.user.findFirst({
        where: {
          OR: [
            { username: username },
            { email: username },
            { phone: username },
          ],
          isActive: true,
        },
      });
      if (user && (await bcrypt.compare(password, user.password))) {
        const accessToken = this.jwtService.sign({
          userId: user.id,
        });
        await this.cacheManager.set(`user/${accessToken}`, 1);
        return accessToken;
      } else
        throw new BadRequestException(
          MESSAGE_ERROR.INCORRECT_USERNAME_OR_PASSWORD,
        );
    } catch (e) {
      console.log(e);
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async register(createUser: RegisterDto) {
    const { username, password, email, phone } = createUser;
    const user = await this.userService.findFirstOne({ username });
    if (user) throw new BadRequestException(MESSAGE_ERROR.USERNAME_EXISTS);
    try {
      if (email && (await this.userService.findFirstOne({ email })))
        throw new BadRequestException(MESSAGE_ERROR.EMAIL_EXISTS);
      if (phone && (await this.userService.findFirstOne({ phone })))
        throw new BadRequestException(MESSAGE_ERROR.PHONE_EXISTS);
      const hashedPassword = await bcrypt.hash(password, 10);
      const newUser = {
        ...createUser,
        password: hashedPassword,
        uuid: uuidv4(),
      };
      const accessToken = this.jwtService.sign({
        userId: newUser.uuid,
        expiresIn: 60 * SECONDS_OF_DAY,
      });
      await this.prisma.user.create({ data: newUser });
      await this.cacheManager.set(`user/${accessToken}`, 1);
      return accessToken;
    } catch (e) {
      console.log(e);
      throw new UnprocessableEntityException(e?.response);
    }
  }

  async logout(req: any): Promise<any> {
    try {
      if (req?.headers.authorization) {
        await this.cacheManager.del(
          `user/${req?.headers?.authorization?.replace('Bearer ', '')}`,
        );
      }

      return;
    } catch (e) {
      throw new UnprocessableEntityException(e.message);
    }
  }
}
