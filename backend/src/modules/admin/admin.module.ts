import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminModerationController } from './admin-moderation.controller';
import { AdminModerationService } from './admin-moderation.service';
import { AdminSearchController } from './admin-search.controller';
import { SocialMediaModule } from '../social-media/social-media.module';

@Module({
  imports: [DatabaseModule, SocialMediaModule],
  controllers: [AdminController, AdminModerationController, AdminSearchController],
  providers: [AdminService, AdminModerationService],
})
export class AdminModule {}
