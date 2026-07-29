import '../../domain/entities/property_visit.dart';

class PropertyVisitModel extends PropertyVisit {
  const PropertyVisitModel({
    required super.id,
    required super.propertyId,
    required super.propertyTitle,
    required super.propertyImage,
    required super.ownerId,
    required super.ownerName,
    required super.tenantId,
    required super.tenantName,
    required super.visitDate,
    required super.status,
    super.notes,
  });

  factory PropertyVisitModel.fromJson(Map<String, dynamic> json) {
    return PropertyVisitModel(
      id: json['id'] ?? '',
      propertyId: json['propertyId'] ?? '',
      propertyTitle: json['propertyTitle'] ?? '',
      propertyImage: json['propertyImage'] ?? '',
      ownerId: json['ownerId'] ?? '',
      ownerName: json['ownerName'] ?? '',
      tenantId: json['tenantId'] ?? '',
      tenantName: json['tenantName'] ?? '',
      visitDate: DateTime.parse(json['visitDate']),
      status: json['status'] ?? 'PENDING',
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "id": id,
      "propertyId": propertyId,
      "propertyTitle": propertyTitle,
      "propertyImage": propertyImage,
      "ownerId": ownerId,
      "ownerName": ownerName,
      "tenantId": tenantId,
      "tenantName": tenantName,
      "visitDate": visitDate.toIso8601String(),
      "status": status,
      "notes": notes,
    };
  }
}
