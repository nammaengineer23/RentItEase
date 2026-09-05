import '../../domain/entities/conversation_entity.dart';

class ConversationModel extends ConversationEntity {
  const ConversationModel({
    required super.conversationId,
    required super.propertyId,
    required super.propertyTitle,
    super.propertyImage,
    required super.otherUserId,
    required super.otherUserName,
    super.lastMessage,
    required super.updatedAt,
  });

  factory ConversationModel.fromJson(Map<String, dynamic> json) {
    final property = json['property'] as Map<String, dynamic>?;

    final otherUser = json['otherUser'] as Map<String, dynamic>?;

    final lastMessageData = json['lastMessage'] as Map<String, dynamic>?;

    return ConversationModel(
      conversationId:
          json['conversationId']?.toString() ?? json['id']?.toString() ?? '',

      propertyId: property?['id']?.toString() ?? '',

      propertyTitle: property?['title']?.toString() ?? 'Property',

      propertyImage: property?['imageUrl']?.toString(),

      otherUserId: otherUser?['id']?.toString() ?? '',

      otherUserName: otherUser?['fullName']?.toString() ?? 'User',

      lastMessage: lastMessageData?['text']?.toString(),

      updatedAt:
          DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'conversationId': conversationId,
      'property': {
        'id': propertyId,
        'title': propertyTitle,
        'imageUrl': propertyImage,
      },
      'otherUser': {'id': otherUserId, 'fullName': otherUserName},
      'lastMessage': lastMessage == null ? null : {'text': lastMessage},
      'updatedAt': updatedAt.toIso8601String(),
    };
  }
}
