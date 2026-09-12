import '../../domain/entities/conversation_entity.dart';
import '../../../../core/utils/app_image_url.dart';

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

      propertyImage: _imageUrl(property?['imageUrl'] ?? property?['url']),

      otherUserId: otherUser?['id']?.toString() ?? '',

      otherUserName: otherUser?['fullName']?.toString() ?? 'User',

      lastMessage: lastMessageData?['text']?.toString(),

      updatedAt:
          DateTime.tryParse(json['updatedAt']?.toString() ?? '') ??
          DateTime.now(),
    );
  }

  static String? _imageUrl(dynamic value) {
    final url = AppImageUrl.resolve(value);
    return url.isEmpty ? null : url;
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
