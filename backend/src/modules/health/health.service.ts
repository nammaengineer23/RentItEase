import { Injectable } from '@nestjs/common';

@Injectable()
export class HealthService {
  getHealth() {
    return {
      status: 'ok',
      service: 'RentItEase Backend',
      version: '1.0.0',
      // APP_ENV identifies the deployment tier without changing NODE_ENV,
      // which should remain "production" for optimized staging runtime.
      environment:
        process.env.APP_ENV || process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    };
  }
}
