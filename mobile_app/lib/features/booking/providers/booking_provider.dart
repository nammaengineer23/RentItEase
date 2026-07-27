import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../presentation/widgets/booking_status_chip.dart';

class BookingModel {
  final String id;
  final String propertyTitle;
  final String location;
  final DateTime visitDate;
  final String visitTime;
  final String ownerName;
  final BookingStatus status;

  const BookingModel({
    required this.id,
    required this.propertyTitle,
    required this.location,
    required this.visitDate,
    required this.visitTime,
    required this.ownerName,
    required this.status,
  });

  BookingModel copyWith({
    String? id,
    String? propertyTitle,
    String? location,
    DateTime? visitDate,
    String? visitTime,
    String? ownerName,
    BookingStatus? status,
  }) {
    return BookingModel(
      id: id ?? this.id,
      propertyTitle: propertyTitle ?? this.propertyTitle,
      location: location ?? this.location,
      visitDate: visitDate ?? this.visitDate,
      visitTime: visitTime ?? this.visitTime,
      ownerName: ownerName ?? this.ownerName,
      status: status ?? this.status,
    );
  }
}

class BookingNotifier extends StateNotifier<List<BookingModel>> {
  BookingNotifier() : super(_dummyBookings());

  static List<BookingModel> _dummyBookings() {
    return [
      BookingModel(
        id: '1',
        propertyTitle: '2 BHK Apartment',
        location: 'Whitefield, Bangalore',
        visitDate: DateTime.now().add(
          const Duration(days: 2),
        ),
        visitTime: '10:30 AM',
        ownerName: 'Rahul Sharma',
        status: BookingStatus.pending,
      ),
      BookingModel(
        id: '2',
        propertyTitle: '1 BHK Studio',
        location: 'Marathahalli, Bangalore',
        visitDate: DateTime.now().add(
          const Duration(days: 4),
        ),
        visitTime: '02:00 PM',
        ownerName: 'Priya Verma',
        status: BookingStatus.approved,
      ),
    ];
  }

  void addBooking(BookingModel booking) {
    state = [...state, booking];
  }

  void removeBooking(String id) {
    state = state.where((b) => b.id != id).toList();
  }

  void updateBookingStatus(
    String id,
    BookingStatus status,
  ) {
    state = [
      for (final booking in state)
        if (booking.id == id)
          booking.copyWith(status: status)
        else
          booking,
    ];
  }

  List<BookingModel> pendingBookings() {
    return state
        .where(
          (b) => b.status == BookingStatus.pending,
        )
        .toList();
  }

  List<BookingModel> approvedBookings() {
    return state
        .where(
          (b) => b.status == BookingStatus.approved,
        )
        .toList();
  }

  List<BookingModel> completedBookings() {
    return state
        .where(
          (b) => b.status == BookingStatus.completed,
        )
        .toList();
  }
}

final bookingProvider =
    StateNotifierProvider<BookingNotifier, List<BookingModel>>(
  (ref) => BookingNotifier(),
);