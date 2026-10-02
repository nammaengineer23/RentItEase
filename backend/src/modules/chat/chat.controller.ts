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
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiTags,
} from '@nestjs/swagger';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Throttle } from '@nestjs/throttler';

import { ChatService } from './chat.service';
import { CreateConversationDto } from './dto/create-conversation.dto';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatPaginationDto } from './dto/chat-pagination.dto';

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
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
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


  // ==========================
  // Get Messages
  // ==========================

  @Get('conversations/:conversationId/messages')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  getMessages(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
    @Query() query: ChatPaginationDto,
  ) {
    return this.chatService.getMessages(
      conversationId,
      user.id,
      query.page,
      query.limit,
    );
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
