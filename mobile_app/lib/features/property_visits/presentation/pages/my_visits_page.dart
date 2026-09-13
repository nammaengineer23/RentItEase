import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/utils/app_error_message.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../booking/providers/booking_provider.dart';
import '../../domain/entities/property_visit.dart';
import '../../providers/property_visit_provider.dart';
import '../widgets/visit_card.dart';

class MyVisitsPage extends ConsumerStatefulWidget {
  const MyVisitsPage({super.key});

  @override
  ConsumerState<MyVisitsPage> createState() => _MyVisitsPageState();
}

class _MyVisitsPageState extends ConsumerState<MyVisitsPage> {
  static const _statuses = [
    'ALL',
    'PENDING',
    'APPROVED',
    'COMPLETED',
    'REJECTED',
    'CANCELLED',
  ];

  String _selectedStatus = 'ALL';

  @override
  Widget build(BuildContext context) {
    final visitsState = ref.watch(propertyVisitProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('myPropertyVisits'))),

      body: Column(
        children: [
          SizedBox(
            height: 52,
            child: ListView.separated(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              scrollDirection: Axis.horizontal,
              itemCount: _statuses.length,
              separatorBuilder: (_, _) => const SizedBox(width: 8),
              itemBuilder: (context, index) {
                final status = _statuses[index];
                return ChoiceChip(
                  label: Text(status[0] + status.substring(1).toLowerCase()),
                  selected: _selectedStatus == status,
                  onSelected: (_) => setState(() => _selectedStatus = status),
                );
              },
            ),
          ),
          Expanded(
            child: visitsState.when(
        loading: () {
          return const Center(child: CircularProgressIndicator());
        },

        error: (error, _) {
          return Center(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Icon(Icons.error_outline, size: 70, color: Colors.red),

                  const SizedBox(height: 16),

                  Text(userFriendlyError(error), textAlign: TextAlign.center),

                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: () {
                      ref
                          .read(propertyVisitProvider.notifier)
                          .refreshMyVisits();
                    },
                    child: Text(context.tr('retry')),
                  ),
                ],
              ),
            ),
          );
        },

        data: (List<PropertyVisit> visits) {
          final visibleVisits = visits
              .where(
                (visit) =>
                    _selectedStatus == 'ALL' ||
                    visit.status.toUpperCase() == _selectedStatus,
              )
              .toList();
          if (visibleVisits.isEmpty) {
            return RefreshIndicator(
              onRefresh: () {
                return ref
                    .read(propertyVisitProvider.notifier)
                    .refreshMyVisits();
              },
              child: ListView(
                children: [
                  const SizedBox(height: 120),

                  const Icon(Icons.event_busy, size: 90, color: Colors.grey),

                  const SizedBox(height: 20),

                  Center(
                    child: Text(
                      context.tr('noVisitsBooked'),
                      style: const TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () {
              return ref.read(propertyVisitProvider.notifier).refreshMyVisits();
            },

            child: ListView.builder(
              padding: const EdgeInsets.only(top: 10, bottom: 20),

              itemCount: visibleVisits.length,

              itemBuilder: (context, index) {
                final visit = visibleVisits[index];

                return VisitCard(
                  visit: visit,

                  isOwner: false,

                  onCancel: visit.status == "PENDING"
                      ? () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (_) {
                              return AlertDialog(
                                title: Text(context.tr('cancelVisit')),
                                content: Text(
                                  context.tr('cancelVisitQuestion'),
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pop(context, false);
                                    },
                                    child: Text(context.tr('no')),
                                  ),

                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.pop(context, true);
                                    },
                                    child: Text(context.tr('yes')),
                                  ),
                                ],
                              );
                            },
                          );

                          if (confirm != true) {
                            return;
                          }

                          try {
                            await ref
                                .read(propertyVisitProvider.notifier)
                                .cancelVisit(visit.id);

                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(
                                  content: Text(context.tr('visitCancelled')),
                                ),
                              );
                            }
                          } catch (e) {
                            if (context.mounted) {
                              ScaffoldMessenger.of(context).showSnackBar(
                                SnackBar(content: Text(e.toString())),
                              );
                            }
                          }
                        }
                      : null,
                  onCreateBooking: visit.status == 'APPROVED'
                      ? () => _createBooking(context, ref, visit)
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

  Future<void> _createBooking(
    BuildContext context,
    WidgetRef ref,
    PropertyVisit visit,
  ) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (dialogContext) => AlertDialog(
        title: const Text('Create booking?'),
        content: Text(
          'Create a booking request for ${visit.propertyTitle}?',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(dialogContext, false),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () => Navigator.pop(dialogContext, true),
            child: const Text('Create Booking'),
          ),
        ],
      ),
    );

    if (confirmed != true || !context.mounted) return;

    try {
      await ref.read(createBookingProvider).create(visitId: visit.id);

      if (!context.mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Booking created successfully.')),
      );
      context.go('/my-bookings');
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text(userFriendlyError(error))),
      );
    }
  }
}
