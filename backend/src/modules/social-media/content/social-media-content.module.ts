import { Module } from '@nestjs/common';
import { CaptionService } from './caption.service';
import { HashtagService } from './hashtag.service';
import { ContentValidatorService } from './content-validator.service';
@Module({ providers: [CaptionService, HashtagService, ContentValidatorService], exports: [CaptionService, HashtagService, ContentValidatorService] })
export class SocialMediaContentModule {}
