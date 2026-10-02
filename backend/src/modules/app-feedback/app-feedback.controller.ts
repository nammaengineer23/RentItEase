import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppFeedbackService } from './app-feedback.service';
import { CreateAppFeedbackDto } from './dto/create-app-feedback.dto';

@ApiTags('App Feedback')
@Controller('app-feedback')
export class AppFeedbackController {
  constructor(private readonly service: AppFeedbackService) {}

  @Get('public-summary')
  publicSummary() {
    return this.service.publicSummary();
  }

  @Post('download')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  recordDownload(@Body() body: { source?: string }) {
    return this.service.recordDownload(body.source);
  }

  @Post('visit')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  recordVisit(@Body() body: { visitorId?: string }) {
    return this.service.recordVisit(body.visitorId);
  }

  @Post()
  @Throttle({ default: { limit: 5, ttl: 600_000 } })
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateAppFeedbackDto) {
    return this.service.create(user.id, dto);
  }
}
