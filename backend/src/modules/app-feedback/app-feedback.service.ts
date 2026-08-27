import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../database/prisma.service';
import { CreateAppFeedbackDto } from './dto/create-app-feedback.dto';

@Injectable()
export class AppFeedbackService {
  constructor(private readonly prisma: PrismaService) {}

  create(userId: string, dto: CreateAppFeedbackDto) {
    return this.prisma.appFeedback.create({
      data: {
        userId,
        rating: dto.rating,
        comment: dto.comment?.trim() || null,
        platform: dto.platform,
        appVersion: dto.appVersion,
      },
    });
  }
}
