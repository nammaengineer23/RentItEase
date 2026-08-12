import '../entities/conversation_entity.dart';
import '../entities/message_entity.dart';

abstract class ChatRepository {
  /// Get all conversations for the authenticated user.
  Future<List<ConversationEntity>> getConversations();

  /// Start a conversation for a property.
  Future<ConversationEntity> createConversation({required String propertyId});

  /// Get all messages in a conversation.
  Future<List<MessageEntity>> getMessages({required String conversationId});

  /// Send a text message.
  Future<MessageEntity> sendMessage({
    required String conversationId,
    required String text,
  });

  /// Mark all unread messages in a conversation as read.
  Future<void> markAsRead({required String conversationId});

  /// Edit an existing message.
  Future<MessageEntity> editMessage({
    required String messageId,
    required String text,
  });

  /// Delete an existing message.
  Future<void> deleteMessage({required String messageId});
}
