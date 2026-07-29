class VisitRequestModel {
  final String id;
  final String propertyId;
  final String tenantId;
  final DateTime visitDate;
  final String status;
  final String? notes;

  VisitRequestModel({
    required this.id,

    required this.propertyId,

    required this.tenantId,

    required this.visitDate,

    required this.status,

    this.notes,
  });

  factory VisitRequestModel.fromJson(Map<String, dynamic> json) {
    return VisitRequestModel(
      id: json['id'] ?? '',

      propertyId: json['propertyId'] ?? '',

      tenantId: json['tenantId'] ?? '',

      visitDate: json['visitDate'] != null
          ? DateTime.parse(json['visitDate'])
          : DateTime.now(),

      status: json['status'] ?? 'PENDING',

      notes: json['notes'],
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,

      'propertyId': propertyId,

      'tenantId': tenantId,

      'visitDate': visitDate.toIso8601String(),

      'status': status,

      'notes': notes,
    };
  }
}
