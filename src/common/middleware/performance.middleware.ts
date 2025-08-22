import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class PerformanceMiddleware implements NestMiddleware {
  private readonly logger = new Logger(PerformanceMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      const { statusCode } = res;
      
      // 记录慢查询（超过1秒）
      if (duration > 1000) {
        this.logger.warn(`慢请求: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
      } else if (duration > 500) {
        this.logger.log(`请求: ${method} ${originalUrl} - ${statusCode} - ${duration}ms`);
      }
    });

    next();
  }
}