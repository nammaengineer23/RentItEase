import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../domain/entities/property_visit.dart';
import '../../providers/property_visit_provider.dart';
import '../widgets/visit_card.dart';

class MyVisitsPage extends ConsumerWidget {
  const MyVisitsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitsState = ref.watch(propertyVisitProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('My Property Visits')),

      body: visitsState.when(
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

                  Text(error.toString(), textAlign: TextAlign.center),

                  const SizedBox(height: 20),

                  ElevatedButton(
                    onPressed: () {
                      ref
                          .read(propertyVisitProvider.notifier)
                          .refreshMyVisits();
                    },
                    child: const Text('Retry'),
                  ),
                ],
              ),
            ),
          );
        },

        data: (List<PropertyVisit> visits) {
          if (visits.isEmpty) {
            return RefreshIndicator(
              onRefresh: () {
                return ref
                    .read(propertyVisitProvider.notifier)
                    .refreshMyVisits();
              },
              child: ListView(
                children: const [
                  SizedBox(height: 120),

                  Icon(Icons.event_busy, size: 90, color: Colors.grey),

                  SizedBox(height: 20),

                  Center(
                    child: Text(
                      'No property visits booked yet.',
                      style: TextStyle(fontSize: 18),
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

              itemCount: visits.length,

              itemBuilder: (context, index) {
                final visit = visits[index];

                return VisitCard(
                  visit: visit,

                  isOwner: false,

                  onCancel: visit.status == "PENDING"
                      ? () async {
                          final confirm = await showDialog<bool>(
                            context: context,
                            builder: (_) {
                              return AlertDialog(
                                title: const Text('Cancel Visit'),
                                content: const Text(
                                  'Are you sure you want to cancel this visit?',
                                ),
                                actions: [
                                  TextButton(
                                    onPressed: () {
                                      Navigator.pop(context, false);
                                    },
                                    child: const Text('No'),
                                  ),

                                  ElevatedButton(
                                    onPressed: () {
                                      Navigator.pop(context, true);
                                    },
                                    child: const Text('Yes'),
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
                                const SnackBar(
                                  content: Text(
                                    'Visit cancelled successfully.',
                                  ),
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
                );
              },
            ),
          );
        },
      ),
    );
  }
}
