import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({
    example: 'Hello, is this property still available?',
    maxLength: 2000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;

  @ApiPropertyOptional({ description: 'Private chat attachment storage key returned by the upload endpoint.' })
  @IsOptional()
  @IsString()
  attachmentPublicId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(255)
  attachmentFileName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  attachmentMimeType?: string;

  @ApiPropertyOptional()
  @IsOptional()
  attachmentSize?: number;

  @ApiPropertyOptional({
    enum: MessageType,
    default: MessageType.TEXT,
    example: MessageType.TEXT,
  })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;
}