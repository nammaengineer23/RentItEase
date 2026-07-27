import 'package:flutter_riverpod/flutter_riverpod.dart';

class ChatMessage {
  final String id;
  final String senderId;
  final String receiverId;
  final String message;
  final DateTime timestamp;
  final bool isMine;
  final bool isRead;

  const ChatMessage({
    required this.id,
    required this.senderId,
    required this.receiverId,
    required this.message,
    required this.timestamp,
    required this.isMine,
    this.isRead = false,
  });

  ChatMessage copyWith({
    String? id,
    String? senderId,
    String? receiverId,
    String? message,
    DateTime? timestamp,
    bool? isMine,
    bool? isRead,
  }) {
    return ChatMessage(
      id: id ?? this.id,
      senderId: senderId ?? this.senderId,
      receiverId: receiverId ?? this.receiverId,
      message: message ?? this.message,
      timestamp: timestamp ?? this.timestamp,
      isMine: isMine ?? this.isMine,
      isRead: isRead ?? this.isRead,
    );
  }
}

class ChatNotifier extends StateNotifier<List<ChatMessage>> {
  ChatNotifier() : super(_dummyMessages());

  static List<ChatMessage> _dummyMessages() {
    return [
      ChatMessage(
        id: '1',
        senderId: 'owner1',
        receiverId: 'tenant1',
        message: 'Hello! Are you interested in the apartment?',
        timestamp: DateTime.now().subtract(
          const Duration(minutes: 20),
        ),
        isMine: false,
        isRead: true,
      ),
      ChatMessage(
        id: '2',
        senderId: 'tenant1',
        receiverId: 'owner1',
        message: 'Yes, I would like to schedule a visit.',
        timestamp: DateTime.now().subtract(
          const Duration(minutes: 18),
        ),
        isMine: true,
        isRead: true,
      ),
      ChatMessage(
        id: '3',
        senderId: 'owner1',
        receiverId: 'tenant1',
        message: 'Sure. Tomorrow at 10:30 AM works.',
        timestamp: DateTime.now().subtract(
          const Duration(minutes: 15),
        ),
        isMine: false,
      ),
    ];
  }

  void sendMessage(String text) {
    if (text.trim().isEmpty) return;

    state = [
      ...state,
      ChatMessage(
        id: DateTime.now()
            .millisecondsSinceEpoch
            .toString(),
        senderId: 'tenant1',
        receiverId: 'owner1',
        message: text,
        timestamp: DateTime.now(),
        isMine: true,
      ),
    ];
  }

  void receiveMessage(String text) {
    state = [
      ...state,
      ChatMessage(
        id: DateTime.now()
            .millisecondsSinceEpoch
            .toString(),
        senderId: 'owner1',
        receiverId: 'tenant1',
        message: text,
        timestamp: DateTime.now(),
        isMine: false,
      ),
    ];
  }

  void clearChat() {
    state = [];
  }
}

final chatProvider =
    StateNotifierProvider<ChatNotifier, List<ChatMessage>>(
  (ref) => ChatNotifier(),
);