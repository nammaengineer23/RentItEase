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
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
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
  constructor(private readonly chatService: ChatService) {}

  @Post('conversations')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  createConversation(
    @CurrentUser() user: any,
    @Body() dto: CreateConversationDto,
  ) {
    return this.chatService.createConversation(dto.propertyId, user.id);
  }

  @Get('conversations')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  listConversations(@CurrentUser() user: any) {
    return this.chatService.listConversations(user.id);
  }

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

  @Patch('conversations/:conversationId/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  markAsRead(
    @Param('conversationId') conversationId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.markAsRead(conversationId, user.id);
  }

  @Patch('messages/:messageId')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  editMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
    @Body() dto: SendMessageDto,
  ) {
    return this.chatService.editMessage(messageId, user.id, dto.text);
  }

  @Delete('messages/:messageId')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  deleteMessage(
    @Param('messageId') messageId: string,
    @CurrentUser() user: any,
  ) {
    return this.chatService.deleteMessage(messageId, user.id);
  }
}
