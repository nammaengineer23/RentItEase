class NotificationModel {
  final String id;

  final String title;

  final String message;

  final String type;

  final bool isRead;

  final DateTime createdAt;

  final String? relatedId;

  NotificationModel({
    required this.id,

    required this.title,

    required this.message,

    required this.type,

    required this.isRead,

    required this.createdAt,

    this.relatedId,
  });

  factory NotificationModel.fromJson(Map<String, dynamic> json) {
    return NotificationModel(
      id: json['id'] ?? '',

      title: json['title'] ?? '',

      message: json['message'] ?? '',

      type: json['type'] ?? 'GENERAL',

      isRead: json['isRead'] ?? false,

      createdAt: DateTime.tryParse(json['createdAt'] ?? '') ?? DateTime.now(),

      relatedId: json['relatedId'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,

      'title': title,

      'message': message,

      'type': type,

      'isRead': isRead,

      'createdAt': createdAt.toIso8601String(),

      'relatedId': relatedId,
    };
  }
}
