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
    final property = json['property'] is Map
        ? Map<String, dynamic>.from(json['property'] as Map)
        : const <String, dynamic>{};
    final tenant = json['tenant'] is Map
        ? Map<String, dynamic>.from(json['tenant'] as Map)
        : const <String, dynamic>{};
    final images = property['images'];
    final primaryImage =
        images is List && images.isNotEmpty && images.first is Map
        ? Map<String, dynamic>.from(images.first as Map)
        : const <String, dynamic>{};

    return VisitRequestModel(
      id: json['id']?.toString() ?? '',
      propertyId:
          json['propertyId']?.toString() ?? property['id']?.toString() ?? '',
      propertyTitle:
          json['propertyTitle']?.toString() ??
          property['title']?.toString() ??
          '',
      propertyImage:
          json['propertyImage']?.toString() ??
          primaryImage['imageUrl']?.toString() ??
          '',
      tenantId: json['tenantId']?.toString() ?? tenant['id']?.toString() ?? '',
      tenantName:
          json['tenantName']?.toString() ??
          tenant['fullName']?.toString() ??
          '',
      tenantPhone:
          json['tenantPhone']?.toString() ?? tenant['phone']?.toString() ?? '',
      visitDate:
          DateTime.tryParse(json['visitDate']?.toString() ?? '')?.toLocal() ??
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
