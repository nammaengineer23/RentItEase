import '../../domain/entities/visit_request_entity.dart';

class VisitRequestModel extends VisitRequestEntity {
  const VisitRequestModel({
    required super.id,
    required super.propertyId,
    required super.propertyTitle,
    required super.propertyImage,
    required super.tenantId,
    required super.tenantName,
    required super.tenantPhone,
    required super.visitDate,
    required super.status,
    super.notes,
  });

  factory VisitRequestModel.fromJson(Map<String, dynamic> json) {
    return VisitRequestModel(
      id: json['id']?.toString() ?? '',
      propertyId: json['propertyId']?.toString() ?? '',
      propertyTitle: json['propertyTitle'] ?? '',
      propertyImage: json['propertyImage'] ?? '',
      tenantId: json['tenantId']?.toString() ?? '',
      tenantName: json['tenantName'] ?? '',
      tenantPhone: json['tenantPhone'] ?? '',
      visitDate:
          DateTime.tryParse(json['visitDate']?.toString() ?? '') ??
          DateTime.now(),
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
      'tenantId': tenantId,
      'tenantName': tenantName,
      'tenantPhone': tenantPhone,
      'visitDate': visitDate.toIso8601String(),
      'status': status,
      'notes': notes,
    };
  }

  VisitRequestModel copyWith({
    String? id,
    String? propertyId,
    String? propertyTitle,
    String? propertyImage,
    String? tenantId,
    String? tenantName,
    String? tenantPhone,
    DateTime? visitDate,
    String? status,
    String? notes,
  }) {
    return VisitRequestModel(
      id: id ?? this.id,
      propertyId: propertyId ?? this.propertyId,
      propertyTitle: propertyTitle ?? this.propertyTitle,
      propertyImage: propertyImage ?? this.propertyImage,
      tenantId: tenantId ?? this.tenantId,
      tenantName: tenantName ?? this.tenantName,
      tenantPhone: tenantPhone ?? this.tenantPhone,
      visitDate: visitDate ?? this.visitDate,
      status: status ?? this.status,
      notes: notes ?? this.notes,
    );
  }
}
