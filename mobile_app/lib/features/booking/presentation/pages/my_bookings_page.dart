import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../payment/presentation/pages/payment_page.dart';
import '../../providers/booking_provider.dart';
import '../widgets/booking_card.dart';

class MyBookingsPage extends ConsumerWidget {
  const MyBookingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookingsAsync = ref.watch(tenantBookingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings'), centerTitle: true),
      body: bookingsAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stackTrace) => _ErrorView(
          error: error,
          onRetry: () {
            ref.invalidate(tenantBookingsProvider);
          },
        ),
        data: (bookings) {
          if (bookings.isEmpty) {
            return const _EmptyBookingsView();
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(tenantBookingsProvider);

              await ref.read(tenantBookingsProvider.future);
            },
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 12, bottom: 24),
              itemCount: bookings.length,
              itemBuilder: (context, index) {
                final booking = bookings[index];

                return BookingCard(
                  bookingId: booking.id,
                  propertyTitle: booking.propertyTitle,
                  location: booking.location,
                  visitDate: booking.visitDate,
                  visitTime: booking.visitTime,
                  ownerName: booking.ownerName,
                  status: booking.status,
                  monthlyRent: booking.monthlyRent,
                  securityDeposit: booking.securityDeposit,
                  onTap: () {
                    _showBookingDetails(context, booking);
                  },
                  onPayNow: booking.status == 'PAYMENT_PENDING'
                      ? () {
                          Navigator.of(context).push(
                            MaterialPageRoute(
                              builder: (_) =>
                                  PaymentPage(bookingId: booking.id),
                            ),
                          );
                        }
                      : null,
                );
              },
            ),
          );
        },
      ),
    );
  }

  void _showBookingDetails(BuildContext context, dynamic booking) {
    showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      builder: (context) {
        return SafeArea(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  booking.propertyTitle,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.bold),
                ),
                const SizedBox(height: 16),
                Text('Location: ${booking.location}'),
                const SizedBox(height: 8),
                Text('Owner: ${booking.ownerName}'),
                const SizedBox(height: 8),
                Text(
                  'Monthly Rent: '
                  '₹${booking.monthlyRent.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 8),
                Text(
                  'Security Deposit: '
                  '₹${booking.securityDeposit.toStringAsFixed(2)}',
                ),
                const SizedBox(height: 8),
                Text('Status: ${booking.status}'),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _EmptyBookingsView extends StatelessWidget {
  const _EmptyBookingsView();

  @override
  Widget build(BuildContext context) {
    return const Center(
      child: Padding(
        padding: EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.calendar_month_outlined, size: 80, color: Colors.grey),
            SizedBox(height: 16),
            Text(
              'No Bookings Yet',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            SizedBox(height: 8),
            Text(
              'Book a property visit to see your bookings here.',
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _ErrorView extends StatelessWidget {
  const _ErrorView({required this.error, required this.onRetry});

  final Object error;
  final VoidCallback onRetry;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Icon(Icons.error_outline, size: 56),
            const SizedBox(height: 16),
            Text(error.toString(), textAlign: TextAlign.center),
            const SizedBox(height: 20),
            FilledButton.icon(
              onPressed: onRetry,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }
}
