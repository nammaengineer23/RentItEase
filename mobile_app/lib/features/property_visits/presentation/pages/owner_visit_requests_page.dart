import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/property_visit.dart';
import '../../providers/property_visit_provider.dart';
import '../widgets/visit_card.dart';

class OwnerVisitRequestsPage extends ConsumerWidget {
  const OwnerVisitRequestsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitsState = ref.watch(propertyVisitProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Visit Requests')),
      body: visitsState.when(
        loading: () => const Center(child: CircularProgressIndicator()),

        error: (error, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.error_outline, size: 70, color: Colors.red),

                const SizedBox(height: 20),

                Text(error.toString(), textAlign: TextAlign.center),

                const SizedBox(height: 20),

                ElevatedButton(
                  onPressed: () {
                    ref
                        .read(propertyVisitProvider.notifier)
                        .refreshOwnerVisits();
                  },
                  child: const Text('Retry'),
                ),
              ],
            ),
          ),
        ),

        data: (List<PropertyVisit> visits) {
          if (visits.isEmpty) {
            return RefreshIndicator(
              onRefresh: () {
                return ref
                    .read(propertyVisitProvider.notifier)
                    .refreshOwnerVisits();
              },
              child: ListView(
                children: const [
                  SizedBox(height: 120),

                  Icon(Icons.event_busy, size: 90, color: Colors.grey),

                  SizedBox(height: 20),

                  Center(
                    child: Text(
                      'No visit requests found.',
                      style: TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () {
              return ref
                  .read(propertyVisitProvider.notifier)
                  .refreshOwnerVisits();
            },
            child: ListView.builder(
              padding: const EdgeInsets.only(top: 10, bottom: 20),
              itemCount: visits.length,
              itemBuilder: (context, index) {
                final visit = visits[index];

                return VisitCard(
                  visit: visit,

                  isOwner: true,

                  onApprove: visit.status == "PENDING"
                      ? () async {
                          try {
                            await ref
                                .read(propertyVisitProvider.notifier)
                                .approveVisit(visit.id);

                            if (!context.mounted) {
                              return;
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Visit approved.')),
                            );
                          } catch (e) {
                            if (!context.mounted) {
                              return;
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(e.toString())),
                            );
                          }
                        }
                      : null,

                  onReject: visit.status == "PENDING"
                      ? () async {
                          try {
                            await ref
                                .read(propertyVisitProvider.notifier)
                                .rejectVisit(visit.id);

                            if (!context.mounted) {
                              return;
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Visit rejected.')),
                            );
                          } catch (e) {
                            if (!context.mounted) {
                              return;
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(e.toString())),
                            );
                          }
                        }
                      : null,

                  onComplete: visit.status == "APPROVED"
                      ? () async {
                          try {
                            await ref
                                .read(propertyVisitProvider.notifier)
                                .completeVisit(visit.id);

                            if (!context.mounted) {
                              return;
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Visit completed.')),
                            );
                          } catch (e) {
                            if (!context.mounted) {
                              return;
                            }

                            ScaffoldMessenger.of(context).showSnackBar(
                              SnackBar(content: Text(e.toString())),
                            );
                          }
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
}
