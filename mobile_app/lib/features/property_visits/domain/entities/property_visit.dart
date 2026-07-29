class PropertyVisit {
  final String id;
  final String propertyId;
  final String propertyTitle;
  final String propertyImage;

  final String ownerId;
  final String ownerName;

  final String tenantId;
  final String tenantName;

  final DateTime visitDate;

  final String status;

  final String? notes;

  const PropertyVisit({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyImage,
    required this.ownerId,
    required this.ownerName,
    required this.tenantId,
    required this.tenantName,
    required this.visitDate,
    required this.status,
    this.notes,
  });

  PropertyVisit copyWith({
    String? id,
    String? propertyId,
    String? propertyTitle,
    String? propertyImage,
    String? ownerId,
    String? ownerName,
    String? tenantId,
    String? tenantName,
    DateTime? visitDate,
    String? status,
    String? notes,
  }) {
    return PropertyVisit(
      id: id ?? this.id,
      propertyId: propertyId ?? this.propertyId,
      propertyTitle: propertyTitle ?? this.propertyTitle,
      propertyImage: propertyImage ?? this.propertyImage,
      ownerId: ownerId ?? this.ownerId,
      ownerName: ownerName ?? this.ownerName,
      tenantId: tenantId ?? this.tenantId,
      tenantName: tenantName ?? this.tenantName,
      visitDate: visitDate ?? this.visitDate,
      status: status ?? this.status,
      notes: notes ?? this.notes,
    );
  }
}
