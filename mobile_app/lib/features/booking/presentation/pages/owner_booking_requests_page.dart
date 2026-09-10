import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/booking_entity.dart';
import '../../providers/booking_provider.dart';

class OwnerBookingRequestsPage extends ConsumerWidget {
  const OwnerBookingRequestsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final bookings = ref.watch(ownerBookingsProvider);
    return Scaffold(
      appBar: AppBar(title: const Text('Booking Requests')),
      body: bookings.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (_, _) => Center(
          child: FilledButton.icon(
            onPressed: () => ref.invalidate(ownerBookingsProvider),
            icon: const Icon(Icons.refresh),
            label: const Text('Retry'),
          ),
        ),
        data: (items) => RefreshIndicator(
          onRefresh: () async {
            ref.invalidate(ownerBookingsProvider);
            await ref.read(ownerBookingsProvider.future);
          },
          child: items.isEmpty
              ? ListView(children: const [
                  SizedBox(height: 180),
                  Icon(Icons.event_available_outlined, size: 72, color: Colors.grey),
                  SizedBox(height: 16),
                  Center(child: Text('No booking requests yet.')),
                ])
              : ListView.builder(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  itemBuilder: (context, index) => _BookingRequestCard(
                    booking: items[index],
                    onApprove: items[index].status.toUpperCase() == 'PENDING'
                        ? () => _update(context, ref, items[index].id, true)
                        : null,
                    onReject: items[index].status.toUpperCase() == 'PENDING'
                        ? () => _update(context, ref, items[index].id, false)
                        : null,
                  ),
                ),
        ),
      ),
    );
  }

  Future<void> _update(
    BuildContext context,
    WidgetRef ref,
    String bookingId,
    bool approved,
  ) async {
    try {
      if (approved) {
        await ref.read(createBookingProvider).approve(bookingId);
      } else {
        await ref.read(createBookingProvider).reject(bookingId);
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(approved ? 'Booking approved.' : 'Booking rejected.')),
        );
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Unable to update this booking.')),
        );
      }
    }
  }
}

class _BookingRequestCard extends StatelessWidget {
  const _BookingRequestCard({
    required this.booking,
    this.onApprove,
    this.onReject,
  });

  final BookingEntity booking;
  final VoidCallback? onApprove;
  final VoidCallback? onReject;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(booking.propertyTitle, style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(booking.location),
          const SizedBox(height: 6),
          Text('Visit: ${booking.visitDate.day}/${booking.visitDate.month}/${booking.visitDate.year} • ${booking.visitTime}'),
          const SizedBox(height: 6),
          Text('Total: ₹${booking.totalAmount.toStringAsFixed(2)}'),
          const SizedBox(height: 12),
          Row(children: [
            Chip(label: Text(booking.status.replaceAll('_', ' '))),
            const Spacer(),
            if (onReject != null) OutlinedButton(onPressed: onReject, child: const Text('Reject')),
            if (onApprove != null) ...[
              const SizedBox(width: 8),
              FilledButton(onPressed: onApprove, child: const Text('Approve')),
            ],
          ]),
        ]),
      ),
    );
  }
}
