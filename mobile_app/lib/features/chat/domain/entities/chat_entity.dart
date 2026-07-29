class ChatEntity {
  const ChatEntity({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyImage,
    required this.senderId,
    required this.receiverId,
    required this.senderName,
    required this.receiverName,
    required this.senderAvatar,
    required this.receiverAvatar,
    required this.lastMessage,
    required this.lastMessageTime,
    required this.unreadCount,
    required this.isOnline,
    required this.isTyping,
    required this.isRead,
  });

  //==================================================
  // Chat Info
  //==================================================

  final String id;

  final String propertyId;
  final String propertyTitle;
  final String propertyImage;

  //==================================================
  // Users
  //==================================================

  final String senderId;
  final String receiverId;

  final String senderName;
  final String receiverName;

  final String senderAvatar;
  final String receiverAvatar;

  //==================================================
  // Last Message
  //==================================================

  final String lastMessage;
  final DateTime lastMessageTime;

  //==================================================
  // Status
  //==================================================

  final int unreadCount;

  final bool isOnline;
  final bool isTyping;
  final bool isRead;

  //==================================================
  // CopyWith
  //==================================================

  ChatEntity copyWith({
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
    return ChatEntity(
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

  //==================================================
  // Equality
  //==================================================

  @override
  bool operator ==(Object other) {
    if (identical(this, other)) return true;

    return other is ChatEntity &&
        other.id == id &&
        other.propertyId == propertyId &&
        other.propertyTitle == propertyTitle &&
        other.propertyImage == propertyImage &&
        other.senderId == senderId &&
        other.receiverId == receiverId &&
        other.senderName == senderName &&
        other.receiverName == receiverName &&
        other.senderAvatar == senderAvatar &&
        other.receiverAvatar == receiverAvatar &&
        other.lastMessage == lastMessage &&
        other.lastMessageTime == lastMessageTime &&
        other.unreadCount == unreadCount &&
        other.isOnline == isOnline &&
        other.isTyping == isTyping &&
        other.isRead == isRead;
  }

  @override
  int get hashCode {
    return Object.hash(
      id,
      propertyId,
      propertyTitle,
      propertyImage,
      senderId,
      receiverId,
      senderName,
      receiverName,
      senderAvatar,
      receiverAvatar,
      lastMessage,
      lastMessageTime,
      unreadCount,
      isOnline,
      isTyping,
      isRead,
    );
  }

  @override
  String toString() {
    return 'ChatEntity('
        'id: $id, '
        'propertyTitle: $propertyTitle, '
        'senderName: $senderName, '
        'receiverName: $receiverName, '
        'lastMessage: $lastMessage, '
        'unreadCount: $unreadCount'
        ')';
  }
}