import { WorkerService } from './worker.service';
import { CategoryModule } from './modules/category/category.module';
import { PolicyModule } from './modules/policy/policy.module';
import { BusinessModule } from './modules/business/business.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { REDIS_HOST, REDIS_POST, REDIS_URL, SECONDS_OF_DAY } from './constants';
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
import { BullJobQueue } from './modules/job/bull/job-queue.bull';
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, '..', '..', 'assets'),
      serveRoot: '/assets',
    }),
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
    BullModule.registerQueue({ name: 'job-queue' }),
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
    CategoryModule,
    ZipCodeModule,
    JobModule,
  ],
  providers: [
    WorkerService,
    BullJobQueue,
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
  ],
  exports: [AppModule],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RateLimitMiddleware).forRoutes('*');
  }
}
