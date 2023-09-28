import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private readonly limit = 1000; // maximum number of requests
  private readonly interval = 60 * 1000; // time interval (in milliseconds)

  private requests = []; // array to store requests

  use(req: Request, res: Response, next: any) {
    const now = Date.now();
    this.requests = this.requests.filter(
      (request) => request.timestamp + this.interval > now,
    );

    if (this.requests.length >= this.limit) {
      // rate limit exceeded
      return res.status(429).json({ message: 'Too many requests' });
    }

    this.requests.push({ timestamp: now });

    next();
  }
}
