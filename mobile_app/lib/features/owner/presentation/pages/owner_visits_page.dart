import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';

class OwnerVisitsPage extends ConsumerStatefulWidget {
  const OwnerVisitsPage({super.key});

  @override
  ConsumerState<OwnerVisitsPage> createState() => _OwnerVisitsPageState();
}

class _OwnerVisitsPageState extends ConsumerState<OwnerVisitsPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(ownerProvider.notifier).loadVisits();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Visit Requests')),

      body: state.visits.isEmpty
          ? const Center(
              child: Text('No Visit Requests', style: TextStyle(fontSize: 18)),
            )
          : ListView.builder(
              padding: const EdgeInsets.all(16),

              itemCount: state.visits.length,

              itemBuilder: (context, index) {
                final visit = state.visits[index];

                return Card(
                  elevation: 3,

                  margin: const EdgeInsets.only(bottom: 15),

                  child: Padding(
                    padding: const EdgeInsets.all(16),

                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,

                      children: [
                        Row(
                          children: [
                            const Icon(Icons.person),

                            const SizedBox(width: 10),

                            Expanded(
                              child: Text(
                                'Tenant ID: ${visit.tenantId}',

                                style: const TextStyle(
                                  fontWeight: FontWeight.bold,
                                ),
                              ),
                            ),
                          ],
                        ),

                        const SizedBox(height: 10),

                        Text(
                          'Visit Date: ${visit.visitDate.day}/${visit.visitDate.month}/${visit.visitDate.year}',
                        ),

                        const SizedBox(height: 8),

                        Text(
                          'Status: ${visit.status}',

                          style: TextStyle(
                            fontWeight: FontWeight.bold,

                            color: visit.status == 'APPROVED'
                                ? Colors.green
                                : visit.status == 'REJECTED'
                                ? Colors.red
                                : Colors.orange,
                          ),
                        ),

                        if (visit.notes != null)
                          Padding(
                            padding: const EdgeInsets.only(top: 8),

                            child: Text('Note: ${visit.notes}'),
                          ),

                        const SizedBox(height: 15),

                        if (visit.status == 'PENDING')
                          Row(
                            mainAxisAlignment: MainAxisAlignment.end,

                            children: [
                              ElevatedButton(
                                onPressed: () {
                                  ref
                                      .read(ownerProvider.notifier)
                                      .approveVisit(visit.id);
                                },

                                child: const Text('Approve'),
                              ),

                              const SizedBox(width: 10),

                              ElevatedButton(
                                style: ElevatedButton.styleFrom(
                                  backgroundColor: Colors.red,
                                ),

                                onPressed: () {
                                  ref
                                      .read(ownerProvider.notifier)
                                      .rejectVisit(visit.id);
                                },

                                child: const Text('Reject'),
                              ),
                            ],
                          ),

                        if (visit.status == 'APPROVED')
                          Align(
                            alignment: Alignment.centerRight,

                            child: ElevatedButton(
                              onPressed: () {
                                ref
                                    .read(ownerProvider.notifier)
                                    .completeVisit(visit.id);
                              },

                              child: const Text('Mark Completed'),
                            ),
                          ),
                      ],
                    ),
                  ),
                );
              },
            ),
    );
  }
}
