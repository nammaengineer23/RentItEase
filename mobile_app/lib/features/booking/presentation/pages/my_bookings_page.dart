import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/booking_provider.dart';
import '../widgets/booking_card.dart';

class MyBookingsPage extends ConsumerWidget {
  const MyBookingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookings = ref.watch(bookingProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Bookings'),
        centerTitle: true,
      ),
      body: bookings.isEmpty
          ? const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.calendar_month_outlined,
                    size: 80,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 16),
                  Text(
                    'No Bookings Yet',
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text(
                    'Book a property visit to see it here.',
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            )
          : ListView.builder(
              padding: const EdgeInsets.only(
                top: 12,
                bottom: 20,
              ),
              itemCount: bookings.length,
              itemBuilder: (context, index) {
                final booking = bookings[index];

                return BookingCard(
                  propertyTitle: booking.propertyTitle,
                  location: booking.location,
                  visitDate: booking.visitDate,
                  visitTime: booking.visitTime,
                  ownerName: booking.ownerName,
                  status: booking.status,
                  onTap: () {
                    ScaffoldMessenger.of(context).showSnackBar(
                      SnackBar(
                        content: Text(
                          booking.propertyTitle,
                        ),
                      ),
                    );

                    // TODO
                    // Navigate to Booking Details
                  },
                );
              },
            ),
    );
  }
}