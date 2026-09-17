import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../core/utils/app_error_message.dart';
import '../../providers/booking_provider.dart';
import '../widgets/booking_card.dart';
import 'package:go_router/go_router.dart';

class MyBookingsPage extends ConsumerStatefulWidget {
  const MyBookingsPage({super.key});

  @override
  ConsumerState<MyBookingsPage> createState() => _MyBookingsPageState();
}

class _MyBookingsPageState extends ConsumerState<MyBookingsPage> {
  static const _statuses = [
    'ALL',
    'PENDING',
    'APPROVED',
    'PAYMENT_PENDING',
    'PAID',
    'COMPLETED',
    'CANCELLED',
    'REJECTED',
  ];
  final _searchController = TextEditingController();
  String _query = '';
  String _selectedStatus = 'ALL';

  String _normalizeStatus(String status) {
    var value = status.trim();
    if (value.contains('.')) value = value.split('.').last;
    value = value
        .replaceAllMapped(
          RegExp(r'([a-z0-9])([A-Z])'),
          (match) => '${match.group(1)}_${match.group(2)}',
        )
        .toUpperCase()
        .replaceAll(RegExp(r'[\s-]+'), '_');

    // Keep filtering compatible with older API/payment status spellings.
    return switch (value) {
      'PAYMENTPENDING' || 'AWAITING_PAYMENT' => 'PAYMENT_PENDING',
      'PAYMENT_SUCCESS' || 'PAYMENT_SUCCESSFUL' || 'SUCCESS' => 'PAID',
      'CONFIRMED' => 'APPROVED',
      'CANCELED' => 'CANCELLED',
      _ => value,
    };
  }

  String _statusLabel(String status) {
    if (status == 'ALL') return 'All';
    return status
        .split('_')
        .map((part) => part.isEmpty
            ? part
            : '${part[0]}${part.substring(1).toLowerCase()}')
        .join(' ');
  }

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
          SizedBox(
            height: 48,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              scrollDirection: Axis.horizontal,
              itemCount: _statuses.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final status = _statuses[index];
                return ChoiceChip(
                  key: ValueKey('booking-filter-$status'),
                  label: Text(_statusLabel(status)),
                  selected: _selectedStatus == status,
                  onSelected: (selected) {
                    if (!selected && _selectedStatus == status) return;
                    setState(() => _selectedStatus = status);
                  },
                );
              },
            ),
          ),
          Expanded(
            child: bookingsAsync.when(
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
                  final normalizedStatus = _normalizeStatus(booking.status);
                  final matchesQuery =
                      query.isEmpty ||
                      booking.propertyTitle.toLowerCase().contains(query) ||
                      booking.ownerName.toLowerCase().contains(query) ||
                      normalizedStatus.toLowerCase().contains(query) ||
                      _statusLabel(normalizedStatus).toLowerCase().contains(query) ||
                      booking.location.toLowerCase().contains(query);
                  final matchesStatus = _selectedStatus == 'ALL' ||
                      normalizedStatus == _selectedStatus;
                  return matchesQuery && matchesStatus;
                }).toList();

                if (visibleBookings.isEmpty) {
                  return Center(
                    child: Text(
                      _selectedStatus == 'ALL'
                          ? 'No matching bookings.'
                          : 'No ${_statusLabel(_selectedStatus).toLowerCase()} bookings.',
                    ),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async {
                    ref.invalidate(tenantBookingsProvider);
                    await ref.read(tenantBookingsProvider.future);
                  },
                  child: ListView.builder(
                    key: ValueKey('bookings-${_selectedStatus.toLowerCase()}'),
                    padding: const EdgeInsets.only(top: 12, bottom: 24),
                    itemCount: visibleBookings.length,
                    itemBuilder: (context, index) {
                      final booking = visibleBookings[index];
                      final bookingStatus = _normalizeStatus(booking.status);

                      return BookingCard(
                        bookingId: booking.id,
                        propertyTitle: booking.propertyTitle,
                        location: booking.location,
                        visitDate: booking.visitDate,
                        visitTime: booking.visitTime,
                        ownerName: booking.ownerName,
                        status: bookingStatus,
                        monthlyRent: booking.monthlyRent,
                        securityDeposit: booking.securityDeposit,
                        onTap: () {
                          _showBookingDetails(context, booking);
                        },
                        onPayNow: bookingStatus == 'APPROVED' ||
                                bookingStatus == 'PAYMENT_PENDING'
                            ? () => _openPayment(context, booking)
                            : null,
                      );
                    },
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Future<void> _openPayment(BuildContext context, dynamic booking) async {
    try {
      if (_normalizeStatus(booking.status) == 'APPROVED') {
        await ref.read(createBookingProvider).beginPayment(booking.id);
      }

      if (context.mounted) {
        context.push('/payment/${booking.id}');
      }
    } catch (_) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(
            content: Text('Unable to start payment. Please try again.'),
          ),
        );
      }
    }
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
                Text('Status: ${_statusLabel(_normalizeStatus(booking.status))}'),
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
            Text(userFriendlyError(error), textAlign: TextAlign.center),
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
