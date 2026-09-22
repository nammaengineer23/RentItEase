import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AppFeedbackService } from './app-feedback.service';
import { CreateAppFeedbackDto } from './dto/create-app-feedback.dto';

@ApiTags('App Feedback')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('app-feedback')
export class AppFeedbackController {
  constructor(private readonly service: AppFeedbackService) {}

  @Get('public-summary')
  publicSummary() {
    return this.service.publicSummary();
  }

  @Post()
  create(@CurrentUser() user: { id: string }, @Body() dto: CreateAppFeedbackDto) {
    return this.service.create(user.id, dto);
  }
}
