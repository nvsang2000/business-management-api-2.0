import { ImportModule } from './shared/import/import.module';
import { ExportModule } from './shared/export/export.module';
import { FilesModule } from './modules/files/files.module';
import { WorkerService } from './worker.service';
import { CategoriesModule } from './modules/categories/categories.module';
import { PolicyModule } from './modules/policy/policy.module';
import { BusinessModule } from './modules/business/business.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import {
  JOB_QUEUE,
  REDIS_HOST,
  REDIS_POST,
  REDIS_URL,
  SECONDS_OF_DAY,
} from './constants';
import { PrismaModule } from 'nestjs-prisma';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import * as redisStore from 'cache-manager-redis-store';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { BullModule } from '@nestjs/bull';
import { join } from 'path';
import { ServeStaticModule } from '@nestjs/serve-static';
import { RateLimitMiddleware } from './middlewares/rate-limit.middleware';
import { PoliciesGuard } from './guards/policies.guard';
import { RolesGuard } from './guards/roles.guard';
import { APP_GUARD } from '@nestjs/core';
import { ZipCodeModule } from './modules/zipCode/zip-code.module';
import { JobModule } from './modules/job/job.module';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
@Module({
  imports: [
    ImportModule,
    ExportModule,
    FilesModule,
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'assets'),
      serveRoot: '/assets',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get(REDIS_HOST),
          port: configService.get(REDIS_POST),
        },
      }),
    }),
    BullModule.registerQueue({ name: JOB_QUEUE }),
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        config: {
          url: configService.get(REDIS_URL),
        },
      }),
    }),
    CacheModule.register({
      store: redisStore,
      url: process.env.REDIS_URL,
      ttl: 60 * SECONDS_OF_DAY,
      isGlobal: true,
      no_ready_check: true,
    }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule.forRoot({
      isGlobal: true,
      prismaServiceOptions: {
        middlewares: [],
      },
    }),
    PolicyModule,
    AuthModule,
    UsersModule,
    BusinessModule,
    CategoriesModule,
    ZipCodeModule,
    JobModule,
  ],
  providers: [
    WorkerService,
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PoliciesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
  exports: [AppModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
