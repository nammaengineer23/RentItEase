import { Module } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { PremiumListingsController } from './premium-listings.controller';
import { PremiumListingsService } from './premium-listings.service';

@Module({
  controllers: [PremiumListingsController],
  providers: [
    PremiumListingsService,
    PrismaService,
  ],
  exports: [PremiumListingsService],
})
export class PremiumListingsModule {}
