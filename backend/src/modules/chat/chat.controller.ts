import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Query,
  Post,
  UseGuards,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';

@ApiTags('Chat')
@Controller('chat')
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
  ) {}


  // ==========================
  // Start Conversation
  // ==========================

  @Post('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createConversation(
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(
      dto.propertyId,
      user.id,
    );
  }


  // ==========================
  // Conversation List
  // ==========================

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listConversations(
    @CurrentUser() user: any,
  ) {
    return this.chatService.listConversations(
      user.id,
    );
  }


  // ==========================
  // Send Message
  // ==========================

  @Post('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  sendMessage(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.sendMessage(
      conversationId,
      user.id,
      dto.text,
      dto.messageType,
    );
  }



  @Post('conversations/:conversationId/attachments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @UseInterceptors(FileInterceptor('file', {
    storage: memoryStorage(),
    limits: { fileSize: 15 * 1024 * 1024 },
  }))
  uploadAttachment(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.chatService.uploadAttachment(conversationId, user.id, file);
  }

  @Get('messages/:messageId/attachment')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getAttachmentUrl(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.getAttachmentUrl(messageId, user.id);
  }

  // ==========================
  // Get Messages
  // ==========================

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.chatService.getMessages(conversationId, user.id, page === undefined ? 1 : Number(page), limit === undefined ? 50 : Number(limit));
  }


  // ==========================
  // Mark Conversation Messages Read
  // ==========================

  @Patch('conversations/:conversationId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.markAsRead(
      conversationId,
      user.id,
    );
  }


  // ==========================
  // Edit Message
  // ==========================

  @Patch('messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  editMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.editMessage(
      messageId,
      user.id,
      dto.text,
    );
  }


  // ==========================
  // Delete Message
  // ==========================

  @Delete('messages/:messageId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.deleteMessage(
      messageId,
      user.id,
    );
  }
}
