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

  factory PropertyVisitModel.fromJson(
    Map<String, dynamic> json,
  ) {
    final property =
        json['property'] as Map<String, dynamic>? ?? {};

    final owner =
        property['owner'] as Map<String, dynamic>? ?? {};

    final tenant =
        json['tenant'] as Map<String, dynamic>? ?? {};

    final images =
        property['images'] as List<dynamic>? ?? [];

    String propertyImage = '';

    if (images.isNotEmpty) {
      final image =
          images.first as Map<String, dynamic>;

      propertyImage =
          image['url']?.toString() ??
          image['imageUrl']?.toString() ??
          image['secureUrl']?.toString() ??
          '';
    }

    return PropertyVisitModel(
      id: json['id']?.toString() ?? '',

      propertyId:
          json['propertyId']?.toString() ??
          property['id']?.toString() ??
          '',

      propertyTitle:
          property['title']?.toString() ?? '',

      propertyImage: propertyImage,

      ownerId:
          owner['id']?.toString() ??
          property['ownerId']?.toString() ??
          '',

      ownerName:
          owner['fullName']?.toString() ?? '',

      tenantId:
          json['tenantId']?.toString() ??
          tenant['id']?.toString() ??
          '',

      tenantName:
          tenant['fullName']?.toString() ?? '',

      visitDate:
          DateTime.tryParse(
            json['visitDate']?.toString() ?? '',
          ) ??
          DateTime.now(),

      status:
          json['status']?.toString() ?? 'PENDING',

      notes: json['notes']?.toString(),
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