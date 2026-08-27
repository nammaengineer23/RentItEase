import { Module } from '@nestjs/common';

import { DatabaseModule } from '../../database/database.module';
import { AppFeedbackController } from './app-feedback.controller';
import { AppFeedbackService } from './app-feedback.service';

@Module({
  imports: [DatabaseModule],
  controllers: [AppFeedbackController],
  providers: [AppFeedbackService],
})
export class AppFeedbackModule {}
