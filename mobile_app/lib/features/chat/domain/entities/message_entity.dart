class MessageEntity {
  const MessageEntity({
    required this.id,
    required this.conversationId,
    required this.senderId,
    required this.senderName,
    required this.text,
    required this.messageType,
    required this.isRead,
    required this.createdAt,
    this.readAt,
    this.editedAt,
    this.deletedAt,
  });

  final String id;
  final String conversationId;

  final String senderId;
  final String senderName;

  final String text;
  final String messageType;

  final bool isRead;

  final DateTime createdAt;

  final DateTime? readAt;
  final DateTime? editedAt;
  final DateTime? deletedAt;
}