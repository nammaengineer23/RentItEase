import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminModerationController } from './admin-moderation.controller';
import { AdminModerationService } from './admin-moderation.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AdminController, AdminModerationController],
  providers: [AdminService, AdminModerationService],
})
export class AdminModule {}
