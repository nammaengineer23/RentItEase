import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/booking_provider.dart';
import '../widgets/booking_card.dart';
import 'package:go_router/go_router.dart';

class MyBookingsPage extends ConsumerStatefulWidget {
  const MyBookingsPage({super.key});

  @override
  ConsumerState<MyBookingsPage> createState() => _MyBookingsPageState();
}

class _MyBookingsPageState extends ConsumerState<MyBookingsPage> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final bookingsAsync = ref.watch(tenantBookingsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Bookings'), centerTitle: true),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _query = value.trim()),
              decoration: const InputDecoration(
                hintText: 'Search bookings by property, owner or status',
                prefixIcon: Icon(Icons.search),
                border: OutlineInputBorder(),
              ),
            ),
          ),
          Expanded(child: bookingsAsync.when(
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

          final query = _query.toLowerCase();
          final visibleBookings = bookings.where((booking) {
            if (query.isEmpty) return true;
            return booking.propertyTitle.toLowerCase().contains(query) ||
                booking.ownerName.toLowerCase().contains(query) ||
                booking.status.toLowerCase().contains(query) ||
                booking.location.toLowerCase().contains(query);
          }).toList();

          if (visibleBookings.isEmpty) {
            return const Center(child: Text('No matching bookings.'));
          }

          return RefreshIndicator(
            onRefresh: () async {
              ref.invalidate(tenantBookingsProvider);

              await ref.read(tenantBookingsProvider.future);
            },
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 12, bottom: 24),
              itemCount: visibleBookings.length,
              itemBuilder: (context, index) {
                final booking = visibleBookings[index];

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
                 onPayNow: booking.status.toUpperCase() == 'PAYMENT_PENDING'
                         ? () {
                               context.push('/payment/${booking.id}');
                              }
                       : null,
                );
              },
            ),
          );
        },
      )),
        ],
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
