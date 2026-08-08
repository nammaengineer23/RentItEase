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
      id: json['id']?.toString() ?? '',
      propertyId: json['propertyId']?.toString() ?? '',
      propertyTitle: json['propertyTitle'] ?? '',
      propertyImage: json['propertyImage'] ?? '',
      ownerId: json['ownerId']?.toString() ?? '',
      ownerName: json['ownerName'] ?? '',
      tenantId: json['tenantId']?.toString() ?? '',
      tenantName: json['tenantName'] ?? '',
      visitDate: DateTime.tryParse(json['visitDate'] ?? '') ?? DateTime.now(),
      status: json['status'] ?? 'PENDING',
      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'propertyId': propertyId,
      'propertyTitle': propertyTitle,
      'propertyImage': propertyImage,
      'ownerId': ownerId,
      'ownerName': ownerName,
      'tenantId': tenantId,
      'tenantName': tenantName,
      'visitDate': visitDate.toIso8601String(),
      'status': status,
      'notes': notes,
    };
  }

  @override
PropertyVisitModel copyWith({
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
    return PropertyVisitModel(
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