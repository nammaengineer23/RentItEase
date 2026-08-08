class ActivityEntity {
  const ActivityEntity({
    required this.id,
    required this.title,
    required this.description,
    required this.type,
    required this.createdAt,
  });

  final String id;
  final String title;
  final String description;
  final String type;
  final DateTime createdAt;
}
