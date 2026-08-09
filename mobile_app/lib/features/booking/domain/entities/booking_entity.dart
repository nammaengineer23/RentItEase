class BookingEntity {
  const BookingEntity({
    required this.id,
    required this.propertyId,
    required this.propertyTitle,
    required this.location,
    required this.imageUrl,
    required this.visitId,
    required this.visitDate,
    required this.visitTime,
    required this.ownerId,
    required this.ownerName,
    required this.ownerPhone,
    required this.monthlyRent,
    required this.securityDeposit,
    required this.status,
    required this.bookingDate,
    this.approvedAt,
    this.cancelledAt,
    this.completedAt,
    this.notes,
  });

  final String id;
  final String propertyId;
  final String propertyTitle;
  final String location;
  final String imageUrl;

  final String visitId;
  final DateTime visitDate;
  final String visitTime;

  final String ownerId;
  final String ownerName;
  final String ownerPhone;

  final double monthlyRent;
  final double securityDeposit;

  final String status;

  final DateTime bookingDate;
  final DateTime? approvedAt;
  final DateTime? cancelledAt;
  final DateTime? completedAt;

  final String? notes;

  double get totalAmount => monthlyRent + securityDeposit;
}
