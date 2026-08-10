import { Module } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { MembershipController } from './membership.controller';
import { MembershipService } from './membership.service';

@Module({
  controllers: [MembershipController],
  providers: [MembershipService, PrismaService],
  exports: [MembershipService],
})
export class MembershipModule {}
