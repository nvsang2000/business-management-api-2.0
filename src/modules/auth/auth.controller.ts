import {
  Controller,
  Post,
  Body,
  Injectable,
  UseInterceptors,
  ClassSerializerInterceptor,
  Get,
  Request,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { ApiBasicAuth, ApiTags } from '@nestjs/swagger';
import { LoginDto } from './dto/login.dto';
import { CurrentUser, Public } from 'src/decorators';
import { RegisterDto } from './dto/register.dto';
import { UserEntity } from 'src/entities';
@Injectable()
@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Public()
  @Post('/login')
  async login(@Body() payload: LoginDto) {
    return this.authService.login(payload);
  }

  @Public()
  @Post('/register')
  async register(@Body() payload: RegisterDto) {
    return this.authService.register(payload);
  }

  @UseInterceptors(ClassSerializerInterceptor)
  @ApiBasicAuth('access-token')
  @Get('/profile')
  getProfile(@CurrentUser() currentUser: UserEntity): Promise<UserEntity> {
    return this.authService.getProfile(currentUser);
  }

  @ApiBasicAuth('access-token')
  @Get('/logout')
  async logout(@Request() req) {
    return this.authService.logout(req);
  }
}
