import '../../domain/entities/booking_entity.dart';

class BookingModel extends BookingEntity {
  const BookingModel({
    required super.id,
    required super.propertyId,
    required super.propertyTitle,
    required super.location,
    required super.imageUrl,
    required super.visitId,
    required super.visitDate,
    required super.visitTime,
    required super.ownerId,
    required super.ownerName,
    required super.ownerPhone,
    required super.monthlyRent,
    required super.securityDeposit,
    required super.status,
    required super.bookingDate,
    super.approvedAt,
    super.cancelledAt,
    super.completedAt,
    super.notes,
  });

  factory BookingModel.fromJson(Map<String, dynamic> json) {
    final property = _asMap(json['property']);
    final owner = _asMap(property['owner']);
    final visit = _asMap(json['visit']);

    final images = property['images'];

    String imageUrl = '';

    if (images is List && images.isNotEmpty) {
      final primaryImage = _asMap(images.first);

      imageUrl =
          primaryImage['url']?.toString() ??
          primaryImage['imageUrl']?.toString() ??
          '';
    }

    return BookingModel(
      id: json['id']?.toString() ?? '',
      propertyId: json['propertyId']?.toString() ?? '',
      propertyTitle: property['title']?.toString() ?? 'Property',
      location: _location(property),
      imageUrl: imageUrl,
      visitId: json['visitId']?.toString() ?? '',
      visitDate: _dateTime(visit['visitDate']),
      visitTime: _formatTime(visit['visitDate']),
      ownerId: owner['id']?.toString() ?? '',
      ownerName: owner['fullName']?.toString() ?? 'Property Owner',
      ownerPhone: owner['phone']?.toString() ?? '',
      monthlyRent: _double(json['monthlyRent']),
      securityDeposit: _double(json['securityDeposit']),
      status: json['status']?.toString() ?? 'PENDING',
      bookingDate: _dateTime(json['bookingDate']),
      approvedAt: _nullableDateTime(json['approvedAt']),
      cancelledAt: _nullableDateTime(json['cancelledAt']),
      completedAt: _nullableDateTime(json['completedAt']),
      notes: json['notes']?.toString(),
    );
  }

  static Map<String, dynamic> _asMap(dynamic value) {
    if (value is Map<String, dynamic>) {
      return value;
    }

    if (value is Map) {
      return Map<String, dynamic>.from(value);
    }

    return <String, dynamic>{};
  }

  static double _double(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value?.toString() ?? '') ?? 0;
  }

  static DateTime _dateTime(dynamic value) {
    return DateTime.tryParse(value?.toString() ?? '') ?? DateTime.now();
  }

  static DateTime? _nullableDateTime(dynamic value) {
    if (value == null) {
      return null;
    }

    return DateTime.tryParse(value.toString());
  }

  static String _location(Map<String, dynamic> property) {
    final locality = property['locality']?.toString() ?? '';
    final city = property['city']?.toString() ?? '';

    if (locality.isNotEmpty && city.isNotEmpty) {
      return '$locality, $city';
    }

    return locality.isNotEmpty ? locality : city;
  }

  static String _formatTime(dynamic value) {
    final date = DateTime.tryParse(value?.toString() ?? '');

    if (date == null) {
      return '';
    }

    final hour = date.hour;
    final minute = date.minute;

    final period = hour >= 12 ? 'PM' : 'AM';
    final displayHour = hour % 12 == 0 ? 12 : hour % 12;
    final displayMinute = minute.toString().padLeft(2, '0');

    return '$displayHour:$displayMinute $period';
  }
}
