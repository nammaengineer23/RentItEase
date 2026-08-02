import '../../domain/entities/chat_entity.dart';

class ChatModel extends ChatEntity {
  const ChatModel({
    required super.id,
    required super.propertyId,
    required super.propertyTitle,
    required super.propertyImage,
    required super.senderId,
    required super.receiverId,
    required super.senderName,
    required super.receiverName,
    required super.senderAvatar,
    required super.receiverAvatar,
    required super.lastMessage,
    required super.lastMessageTime,
    required super.unreadCount,
    required super.isOnline,
    required super.isTyping,
    required super.isRead,
  });

  factory ChatModel.fromJson(Map<String, dynamic> json) {
    return ChatModel(
      id: json['id'] ?? '',
      propertyId: json['propertyId'] ?? '',
      propertyTitle: json['propertyTitle'] ?? '',
      propertyImage: json['propertyImage'] ?? '',
      senderId: json['senderId'] ?? '',
      receiverId: json['receiverId'] ?? '',
      senderName: json['senderName'] ?? '',
      receiverName: json['receiverName'] ?? '',
      senderAvatar: json['senderAvatar'] ?? '',
      receiverAvatar: json['receiverAvatar'] ?? '',
      lastMessage: json['lastMessage'] ?? '',
      lastMessageTime:
          DateTime.tryParse(json['lastMessageTime'] ?? '') ?? DateTime.now(),
      unreadCount: json['unreadCount'] ?? 0,
      isOnline: json['isOnline'] ?? false,
      isTyping: json['isTyping'] ?? false,
      isRead: json['isRead'] ?? false,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'propertyId': propertyId,
      'propertyTitle': propertyTitle,
      'propertyImage': propertyImage,
      'senderId': senderId,
      'receiverId': receiverId,
      'senderName': senderName,
      'receiverName': receiverName,
      'senderAvatar': senderAvatar,
      'receiverAvatar': receiverAvatar,
      'lastMessage': lastMessage,
      'lastMessageTime': lastMessageTime.toIso8601String(),
      'unreadCount': unreadCount,
      'isOnline': isOnline,
      'isTyping': isTyping,
      'isRead': isRead,
    };
  }

  @override
  ChatModel copyWith({
    String? id,
    String? propertyId,
    String? propertyTitle,
    String? propertyImage,
    String? senderId,
    String? receiverId,
    String? senderName,
    String? receiverName,
    String? senderAvatar,
    String? receiverAvatar,
    String? lastMessage,
    DateTime? lastMessageTime,
    int? unreadCount,
    bool? isOnline,
    bool? isTyping,
    bool? isRead,
  }) {
    return ChatModel(
      id: id ?? this.id,
      propertyId: propertyId ?? this.propertyId,
      propertyTitle: propertyTitle ?? this.propertyTitle,
      propertyImage: propertyImage ?? this.propertyImage,
      senderId: senderId ?? this.senderId,
      receiverId: receiverId ?? this.receiverId,
      senderName: senderName ?? this.senderName,
      receiverName: receiverName ?? this.receiverName,
      senderAvatar: senderAvatar ?? this.senderAvatar,
      receiverAvatar: receiverAvatar ?? this.receiverAvatar,
      lastMessage: lastMessage ?? this.lastMessage,
      lastMessageTime: lastMessageTime ?? this.lastMessageTime,
      unreadCount: unreadCount ?? this.unreadCount,
      isOnline: isOnline ?? this.isOnline,
      isTyping: isTyping ?? this.isTyping,
      isRead: isRead ?? this.isRead,
    );
  }
}
