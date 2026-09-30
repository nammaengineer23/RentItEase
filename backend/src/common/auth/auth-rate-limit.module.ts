import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AuthRateLimitService } from './auth-rate-limit.service';

@Module({
  imports: [PrismaModule],
  providers: [AuthRateLimitService],
  exports: [AuthRateLimitService],
})
export class AuthRateLimitModule {}
