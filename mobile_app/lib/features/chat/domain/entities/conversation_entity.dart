class ConversationEntity {
  const ConversationEntity({
    required this.conversationId,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyImage,
    required this.otherUserId,
    required this.otherUserName,
    required this.lastMessage,
    required this.updatedAt,
  });

  final String conversationId;

  final String propertyId;
  final String propertyTitle;
  final String? propertyImage;

  final String otherUserId;
  final String otherUserName;

  final String? lastMessage;
  final DateTime updatedAt;
}
