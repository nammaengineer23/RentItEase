import 'dart:io';

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
    String messageType = 'TEXT',
  }) async {
    final response = await dio.post(
      '/chat/conversations/$conversationId/messages',
      data: {'text': text, 'messageType': messageType},
    );

    return MessageModel.fromJson(_extractData(response.data));
  }

  Future<String> uploadChatImage(File image) async {
    return _upload(image, '/uploads/image', 'imageUrl');
  }

  Future<String> uploadChatFile(File file) async {
    return _upload(file, '/uploads/file', 'fileUrl');
  }

  Future<String> _upload(File file, String path, String responseKey) async {
    final response = await dio.post(
      path,
      data: FormData.fromMap({
        'file': await MultipartFile.fromFile(
          file.path,
          filename: file.path.split(RegExp(r'[/\\]')).last,
        ),
      }),
      options: Options(contentType: 'multipart/form-data'),
    );
    final data = _extractData(response.data);
    if (data is Map && data[responseKey] != null) {
      return data[responseKey].toString();
    }
    throw const FormatException('Invalid file upload response.');
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
    dynamic value = responseData;
    for (var depth = 0; depth < 5; depth++) {
      if (value is Map && value.containsKey('data')) {
        value = value['data'];
        continue;
      }
      break;
    }
    return value;
  }

  List<dynamic> _extractList(dynamic responseData) {
    final data = _extractData(responseData);

    if (data is List) {
      return data;
    }

    return const [];
  }
}
