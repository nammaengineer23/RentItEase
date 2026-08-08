import '../../domain/entities/message_entity.dart';

class MessageModel extends MessageEntity {
  const MessageModel({
    required super.id,
    required super.conversationId,
    required super.senderId,
    required super.senderName,
    required super.text,
    required super.messageType,
    required super.isRead,
    required super.createdAt,
    super.readAt,
    super.editedAt,
    super.deletedAt,
  });

  factory MessageModel.fromJson(
    Map<String, dynamic> json,
  ) {
    final sender =
        json['sender'] as Map<String, dynamic>?;

    return MessageModel(
      id: json['id']?.toString() ?? '',

      conversationId:
          json['conversationId']?.toString() ?? '',

      senderId:
          json['senderId']?.toString() ?? '',

      senderName:
          sender?['fullName']?.toString() ??
          'User',

      text:
          json['text']?.toString() ?? '',

      messageType:
          json['messageType']?.toString() ?? 'TEXT',

      isRead:
          json['isRead'] == true,

      createdAt:
          DateTime.tryParse(
            json['createdAt']?.toString() ?? '',
          ) ??
          DateTime.now(),

      readAt: _parseDate(json['readAt']),

      editedAt: _parseDate(json['editedAt']),

      deletedAt: _parseDate(json['deletedAt']),
    );
  }

  static DateTime? _parseDate(dynamic value) {
    if (value == null) {
      return null;
    }

    return DateTime.tryParse(value.toString());
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'conversationId': conversationId,
      'senderId': senderId,
      'text': text,
      'messageType': messageType,
      'isRead': isRead,
      'createdAt': createdAt.toIso8601String(),
      'readAt': readAt?.toIso8601String(),
      'editedAt': editedAt?.toIso8601String(),
      'deletedAt': deletedAt?.toIso8601String(),
      'sender': {
        'id': senderId,
        'fullName': senderName,
      },
    };
  }
}