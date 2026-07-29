import '../entities/chat_entity.dart';

abstract class ChatRepository {
  /// Load all conversations
  Future<List<ChatEntity>> load();

  /// Load a single conversation
  Future<ChatEntity?> getConversation(String chatId);

  /// Send a text message
  Future<void> sendMessage({required String chatId, required String message});

  /// Upload an image and send it
  Future<void> sendImage({required String chatId, required String imagePath});

  /// Mark conversation as read
  Future<void> markAsRead(String chatId);

  /// Delete a conversation
  Future<void> deleteConversation(String chatId);

  /// Search conversations
  Future<List<ChatEntity>> search(String keyword);
}
