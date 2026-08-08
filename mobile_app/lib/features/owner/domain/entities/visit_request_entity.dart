class VisitRequestEntity {
  const VisitRequestEntity({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyImage,
    required this.tenantId,
    required this.tenantName,
    required this.tenantPhone,
    required this.visitDate,
    required this.status,
    this.notes,
  });

  final String id;

  final String propertyId;
  final String propertyTitle;
  final String propertyImage;

  final String tenantId;
  final String tenantName;
  final String tenantPhone;

  final DateTime visitDate;

  final String status;

  final String? notes;
}
