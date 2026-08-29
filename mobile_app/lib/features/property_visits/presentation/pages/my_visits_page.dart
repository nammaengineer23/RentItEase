import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../domain/entities/property_visit.dart';
import '../../providers/property_visit_provider.dart';
import '../widgets/visit_card.dart';

class MyVisitsPage extends ConsumerWidget {
  const MyVisitsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final visitsState = ref.watch(propertyVisitProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('myPropertyVisits'))),

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
                    child: Text(context.tr('retry')),
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
                );
              },
            ),
          );
        },
      ),
    );
  }
}
