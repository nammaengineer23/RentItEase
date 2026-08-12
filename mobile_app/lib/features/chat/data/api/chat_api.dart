import 'package:dio/dio.dart';

import '../models/conversation_model.dart';
import '../models/message_model.dart';

class ChatApi {
  ChatApi(this.dio);

  final Dio dio;

  // ==========================================================
  // Create Conversation
  // ==========================================================

  Future<ConversationModel> createConversation({
    required String propertyId,
  }) async {
    final response = await dio.post(
      '/chat/conversations',
      data: {'propertyId': propertyId},
    );

    return ConversationModel.fromJson(_extractData(response.data));
  }

  // ==========================================================
  // Get Conversations
  // ==========================================================

  Future<List<ConversationModel>> getConversations() async {
    final response = await dio.get('/chat/conversations');

    final data = _extractList(response.data);

    return data.map((json) => ConversationModel.fromJson(json)).toList();
  }

  // ==========================================================
  // Get Messages
  // ==========================================================

  Future<List<MessageModel>> getMessages({
    required String conversationId,
  }) async {
    final response = await dio.get(
      '/chat/conversations/$conversationId/messages',
    );

    final data = _extractList(response.data);

    return data.map((json) => MessageModel.fromJson(json)).toList();
  }

  // ==========================================================
  // Send Message
  // ==========================================================

  Future<MessageModel> sendMessage({
    required String conversationId,
    required String text,
  }) async {
    final response = await dio.post(
      '/chat/conversations/$conversationId/messages',
      data: {'text': text},
    );

    return MessageModel.fromJson(_extractData(response.data));
  }

  // ==========================================================
  // Mark As Read
  // ==========================================================

  Future<void> markAsRead({required String conversationId}) async {
    await dio.patch('/chat/conversations/$conversationId/read');
  }

  // ==========================================================
  // Edit Message
  // ==========================================================

  Future<MessageModel> editMessage({
    required String messageId,
    required String text,
  }) async {
    final response = await dio.patch(
      '/chat/messages/$messageId',
      data: {'text': text},
    );

    return MessageModel.fromJson(_extractData(response.data));
  }

  // ==========================================================
  // Delete Message
  // ==========================================================

  Future<void> deleteMessage({required String messageId}) async {
    await dio.delete('/chat/messages/$messageId');
  }

  // ==========================================================
  // Response Helpers
  // ==========================================================

  dynamic _extractData(dynamic responseData) {
    if (responseData is Map<String, dynamic> &&
        responseData.containsKey('data')) {
      return responseData['data'];
    }

    return responseData;
  }

  List<dynamic> _extractList(dynamic responseData) {
    final data = _extractData(responseData);

    if (data is List) {
      return data;
    }

    return const [];
  }
}
