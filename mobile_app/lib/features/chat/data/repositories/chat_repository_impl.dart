import '../../domain/entities/conversation_entity.dart';
import '../../domain/entities/message_entity.dart';
import '../../domain/repositories/chat_repository.dart';

import '../api/chat_api.dart';


class ChatRepositoryImpl implements ChatRepository {
  ChatRepositoryImpl(this.api);

  final ChatApi api;


  @override
  Future<List<ConversationEntity>> getConversations() async {
    return await api.getConversations();
  }


  @override
  Future<ConversationEntity> createConversation({
    required String propertyId,
  }) async {
    return await api.createConversation(
      propertyId: propertyId,
    );
  }


  @override
  Future<List<MessageEntity>> getMessages({
    required String conversationId,
  }) async {
    return await api.getMessages(
      conversationId: conversationId,
    );
  }


  @override
  Future<MessageEntity> sendMessage({
    required String conversationId,
    required String text,
  }) async {
    return await api.sendMessage(
      conversationId: conversationId,
      text: text,
    );
  }


  @override
  Future<void> markAsRead({
    required String conversationId,
  }) async {
    await api.markAsRead(
      conversationId: conversationId,
    );
  }


  @override
  Future<MessageEntity> editMessage({
    required String messageId,
    required String text,
  }) async {
    return await api.editMessage(
      messageId: messageId,
      text: text,
    );
  }


  @override
  Future<void> deleteMessage({
    required String messageId,
  }) async {
    await api.deleteMessage(
      messageId: messageId,
    );
  }
}