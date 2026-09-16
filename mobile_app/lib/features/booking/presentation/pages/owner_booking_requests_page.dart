import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/booking_entity.dart';
import '../../providers/booking_provider.dart';

class OwnerBookingRequestsPage extends ConsumerStatefulWidget {
  const OwnerBookingRequestsPage({super.key});

  @override
  ConsumerState<OwnerBookingRequestsPage> createState() =>
      _OwnerBookingRequestsPageState();
}

class _OwnerBookingRequestsPageState
    extends ConsumerState<OwnerBookingRequestsPage> {
  static const _statuses = [
    'ALL',
    'PENDING',
    'APPROVED',
    'REJECTED',
    'PAID',
    'CANCELLED',
  ];

  String _selectedStatus = 'ALL';

  @override
  Widget build(BuildContext context) {
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
        data: (items) {
          final filtered = _selectedStatus == 'ALL'
              ? items
              : items
                  .where((booking) =>
                      booking.status.toUpperCase() == _selectedStatus)
                  .toList();

          return RefreshIndicator(
            onRefresh: _refresh,
            child: CustomScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              slivers: [
                SliverToBoxAdapter(
                  child: SizedBox(
                    height: 60,
                    child: ListView.separated(
                      padding: const EdgeInsets.fromLTRB(16, 10, 16, 6),
                      scrollDirection: Axis.horizontal,
                      itemCount: _statuses.length,
                      separatorBuilder: (_, _) => const SizedBox(width: 8),
                      itemBuilder: (context, index) {
                        final status = _statuses[index];
                        return ChoiceChip(
                          label: Text(status.replaceAll('_', ' ')),
                          selected: _selectedStatus == status,
                          onSelected: (_) =>
                              setState(() => _selectedStatus = status),
                        );
                      },
                    ),
                  ),
                ),
                if (filtered.isEmpty)
                  SliverFillRemaining(
                    hasScrollBody: false,
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(Icons.event_available_outlined,
                              size: 72, color: Colors.grey),
                          const SizedBox(height: 16),
                          Text(_selectedStatus == 'ALL'
                              ? 'No booking requests yet.'
                              : 'No ${_selectedStatus.toLowerCase()} booking requests.'),
                        ],
                      ),
                    ),
                  )
                else
                  SliverPadding(
                    padding: const EdgeInsets.all(16),
                    sliver: SliverList.builder(
                      itemCount: filtered.length,
                      itemBuilder: (context, index) => _BookingRequestCard(
                        booking: filtered[index],
                        onApprove:
                            filtered[index].status.toUpperCase() == 'PENDING'
                                ? () => _update(
                                    context, filtered[index].id, true)
                                : null,
                        onReject:
                            filtered[index].status.toUpperCase() == 'PENDING'
                                ? () => _update(
                                    context, filtered[index].id, false)
                                : null,
                      ),
                    ),
                  ),
              ],
            ),
          );
        },
      ),
    );
  }

  Future<void> _refresh() async {
    ref.invalidate(ownerBookingsProvider);
    await ref.read(ownerBookingsProvider.future);
  }

  Future<void> _update(
    BuildContext context,
    String bookingId,
    bool approved,
  ) async {
    try {
      if (approved) {
        await ref.read(createBookingProvider).approve(bookingId);
      } else {
        await ref.read(createBookingProvider).reject(bookingId);
      }
      ref.invalidate(ownerBookingsProvider);
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content:
                Text(approved ? 'Booking approved.' : 'Booking rejected.'),
          ),
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
          Text(booking.propertyTitle,
              style: Theme.of(context)
                  .textTheme
                  .titleMedium
                  ?.copyWith(fontWeight: FontWeight.bold)),
          const SizedBox(height: 8),
          Text(booking.location),
          const SizedBox(height: 6),
          Text(
              'Visit: ${booking.visitDate.day}/${booking.visitDate.month}/${booking.visitDate.year} • ${booking.visitTime}'),
          const SizedBox(height: 6),
          Text('Total: ₹${booking.totalAmount.toStringAsFixed(2)}'),
          const SizedBox(height: 12),
          Row(children: [
            Chip(label: Text(booking.status.replaceAll('_', ' '))),
            const Spacer(),
            if (onReject != null)
              OutlinedButton(onPressed: onReject, child: const Text('Reject')),
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
