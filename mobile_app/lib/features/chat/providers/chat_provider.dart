import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChatMessage {
  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.timestamp,
    required this.isMine,
    this.isRead = false,
    this.isImage = false,
    this.imageUrl,
    this.isSending = false,
  });

  final String id;
  final String senderId;
  final String receiverId;

  final String message;

  final DateTime timestamp;

  final bool isMine;

  final bool isRead;

  /// Image Message
  final bool isImage;

  final String? imageUrl;

  /// Uploading state
  final bool isSending;

  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? receiverId,
    String? message,
    DateTime? timestamp,
    bool? isMine,
    bool? isRead,
    bool? isImage,
    String? imageUrl,
    bool? isSending,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      receiverId: receiverId ?? this.receiverId,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      isMine: isMine ?? this.isMine,
      isRead: isRead ?? this.isRead,
      isImage: isImage ?? this.isImage,
      imageUrl: imageUrl ?? this.imageUrl,
      isSending: isSending ?? this.isSending,
    );
  }
}

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier() : super(_dummyMessages());

  bool isTyping = false;

  bool isLoading = false;

  static List<ChatMessage> _dummyMessages() {
    return [
      ChatMessage(
        id: '1',
        senderId: 'owner1',
        receiverId: 'tenant1',
        message: 'Hello! Are you interested in the apartment?',
        timestamp: DateTime.now().subtract(const Duration(minutes: 25)),
        isMine: false,
        isRead: true,
      ),
      ChatMessage(
        id: '2',
        senderId: 'tenant1',
        receiverId: 'owner1',
        message: 'Yes, I would like to schedule a visit.',
        timestamp: DateTime.now().subtract(const Duration(minutes: 22)),
        isMine: true,
        isRead: true,
      ),
      ChatMessage(
        id: '3',
        senderId: 'owner1',
        receiverId: 'tenant1',
        message: 'Sure. Tomorrow at 10:30 AM works.',
        timestamp: DateTime.now().subtract(const Duration(minutes: 20)),
        isMine: false,
      ),
    ];
  }

  Future<void> sendMessage(String text) async {
    if (text.trim().isEmpty) return;

    final message = ChatMessage(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      senderId: 'tenant1',
      receiverId: 'owner1',
      message: text,
      timestamp: DateTime.now(),
      isMine: true,
      isSending: true,
    );

    state = [...state, message];

    await Future.delayed(const Duration(milliseconds: 500));

    state = [
      for (final msg in state)
        if (msg.id == message.id)
          msg.copyWith(isSending: false, isRead: true)
        else
          msg,
    ];
  }

  Future<void> receiveMessage(String text) async {
    state = [
      ...state,
      ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        senderId: 'owner1',
        receiverId: 'tenant1',
        message: text,
        timestamp: DateTime.now(),
        isMine: false,
      ),
    ];
  }

  Future<void> sendImage(String imageUrl) async {
    state = [
      ...state,
      ChatMessage(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        senderId: 'tenant1',
        receiverId: 'owner1',
        message: '',
        imageUrl: imageUrl,
        isImage: true,
        timestamp: DateTime.now(),
        isMine: true,
      ),
    ];
  }

  void markAllRead() {
    state = [for (final message in state) message.copyWith(isRead: true)];
  }

  void setTyping(bool value) {
    isTyping = value;
    state = [...state];
  }

  void clearChat() {
    state = [];
  }
}

final chatProvider = StateNotifierProvider<ChatNotifier, List<ChatMessage>>(
  (ref) => ChatNotifier(),
);
