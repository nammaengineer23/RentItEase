import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MessageType } from '@prisma/client';

export class SendMessageDto {
  @ApiProperty({ example: 'Hello, is this property still available?', maxLength: 2000 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  text!: string;

  @ApiPropertyOptional({ enum: MessageType, default: MessageType.TEXT })
  @IsOptional()
  @IsEnum(MessageType)
  messageType?: MessageType = MessageType.TEXT;
}