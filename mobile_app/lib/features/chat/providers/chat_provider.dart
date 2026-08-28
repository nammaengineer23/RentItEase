import 'dart:io';

import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../data/api/chat_api.dart';
import '../data/repositories/chat_repository_impl.dart';
import '../domain/entities/conversation_entity.dart';
import '../domain/entities/message_entity.dart';
import '../domain/repositories/chat_repository.dart';

class ChatState {
  const ChatState({
    this.conversations = const [],
    this.messages = const [],
    this.activeConversationId,
    this.isLoadingConversations = false,
    this.isLoadingMessages = false,
    this.isSending = false,
    this.error,
  });

  final List<ConversationEntity> conversations;
  final List<MessageEntity> messages;
  final String? activeConversationId;
  final bool isLoadingConversations;
  final bool isLoadingMessages;
  final bool isSending;
  final String? error;

  ChatState copyWith({
    List<ConversationEntity>? conversations,
    List<MessageEntity>? messages,
    String? activeConversationId,
    bool clearActiveConversation = false,
    bool? isLoadingConversations,
    bool? isLoadingMessages,
    bool? isSending,
    String? error,
    bool clearError = false,
  }) {
    return ChatState(
      conversations: conversations ?? this.conversations,
      messages: messages ?? this.messages,
      activeConversationId: clearActiveConversation
          ? null
          : activeConversationId ?? this.activeConversationId,
      isLoadingConversations:
          isLoadingConversations ?? this.isLoadingConversations,
      isLoadingMessages: isLoadingMessages ?? this.isLoadingMessages,
      isSending: isSending ?? this.isSending,
      error: clearError ? null : error ?? this.error,
    );
  }
}

class ChatNotifier extends StateNotifier<ChatState> {
  ChatNotifier(this._repository) : super(const ChatState());

  final ChatRepository _repository;

  Future<void> loadConversations() async {
    state = state.copyWith(isLoadingConversations: true, clearError: true);

    try {
      final conversations = await _repository.getConversations();
      state = state.copyWith(
        conversations: conversations,
        isLoadingConversations: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoadingConversations: false,
        error: _message(error),
      );
    }
  }

  Future<void> openConversation(String conversationId) async {
    state = state.copyWith(
      activeConversationId: conversationId,
      messages: const [],
      isLoadingMessages: true,
      clearError: true,
    );

    try {
      final messages = await _repository.getMessages(
        conversationId: conversationId,
      );
      await _repository.markAsRead(conversationId: conversationId);

      state = state.copyWith(
        messages: messages,
        isLoadingMessages: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoadingMessages: false,
        error: _message(error),
      );
    }
  }

  Future<void> createAndOpenConversation(String propertyId) async {
    state = state.copyWith(
      messages: const [],
      isLoadingMessages: true,
      clearError: true,
    );

    try {
      final conversation = await _repository.createConversation(
        propertyId: propertyId,
      );
      final messages = await _repository.getMessages(
        conversationId: conversation.conversationId,
      );
      await _repository.markAsRead(
        conversationId: conversation.conversationId,
      );

      final conversations = [
        conversation,
        ...state.conversations.where(
          (item) => item.conversationId != conversation.conversationId,
        ),
      ];

      state = state.copyWith(
        conversations: conversations,
        activeConversationId: conversation.conversationId,
        messages: messages,
        isLoadingMessages: false,
      );
    } catch (error) {
      state = state.copyWith(
        isLoadingMessages: false,
        error: _message(error),
      );
    }
  }

  Future<bool> sendMessage(String text) async {
    return _send(text, 'TEXT');
  }

  Future<bool> sendImage(File image) async {
    return sendAttachment(image, 'IMAGE', image: true);
  }

  Future<bool> sendAttachment(
    File file,
    String messageType, {
    bool image = false,
  }) async {
    final conversationId = state.activeConversationId;
    if (conversationId == null || state.isSending) return false;
    state = state.copyWith(isSending: true, clearError: true);
    try {
      final url = image
          ? await _repository.uploadChatImage(file)
          : await _repository.uploadChatFile(file);
      return _send(url, messageType, alreadySending: true);
    } catch (error) {
      state = state.copyWith(isSending: false, error: _message(error));
      return false;
    }
  }

  Future<bool> _send(
    String text,
    String messageType, {
    bool alreadySending = false,
  }) async {
    final conversationId = state.activeConversationId;
    final trimmed = text.trim();

    if (conversationId == null ||
        trimmed.isEmpty ||
        (state.isSending && !alreadySending)) {
      return false;
    }

    state = state.copyWith(isSending: true, clearError: true);

    try {
      final message = await _repository.sendMessage(
        conversationId: conversationId,
        text: trimmed,
        messageType: messageType,
      );

      state = state.copyWith(
        messages: [...state.messages, message],
        isSending: false,
      );
      await loadConversations();
      return true;
    } catch (error) {
      state = state.copyWith(isSending: false, error: _message(error));
      return false;
    }
  }

  void clearError() {
    state = state.copyWith(clearError: true);
  }

  static String _message(Object error) {
    return error.toString().replaceFirst('Exception: ', '');
  }
}

final chatRepositoryProvider = Provider<ChatRepository>((ref) {
  return ChatRepositoryImpl(ChatApi(ref.watch(dioProvider)));
});

final chatProvider = StateNotifierProvider<ChatNotifier, ChatState>((ref) {
  return ChatNotifier(ref.watch(chatRepositoryProvider));
});
