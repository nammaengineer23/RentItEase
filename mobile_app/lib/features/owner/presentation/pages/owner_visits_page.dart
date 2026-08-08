import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/owner_provider.dart';
import '../widgets/visit_request_card.dart';

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
      ref.read(ownerProvider.notifier).loadVisitRequests();
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(ownerProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Visit Requests')),
      body: RefreshIndicator(
        onRefresh: () =>
            ref.read(ownerProvider.notifier).refreshVisitRequests(),
        child: state.loading
            ? const Center(child: CircularProgressIndicator())
            : state.error != null
            ? ListView(
                children: [
                  const SizedBox(height: 120),
                  const Icon(Icons.error_outline, size: 70, color: Colors.red),
                  const SizedBox(height: 20),
                  Center(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 24),
                      child: Text(state.error!, textAlign: TextAlign.center),
                    ),
                  ),
                ],
              )
            : state.visitRequests.isEmpty
            ? ListView(
                children: const [
                  SizedBox(height: 120),
                  Icon(Icons.event_busy, size: 80, color: Colors.grey),
                  SizedBox(height: 20),
                  Center(
                    child: Text(
                      'No visit requests available.',
                      style: TextStyle(fontSize: 18),
                    ),
                  ),
                ],
              )
            : ListView.builder(
                padding: const EdgeInsets.all(16),
                itemCount: state.visitRequests.length,
                itemBuilder: (context, index) {
                  final visit = state.visitRequests[index];

                  return VisitRequestCard(
                    visit: visit,

                    onApprove: visit.status == 'PENDING'
                        ? () async {
                            await ref
                                .read(ownerProvider.notifier)
                                .approveVisit(visit.id);

                            if (!context.mounted) return;

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Visit approved')),
                            );
                          }
                        : null,

                    onReject: visit.status == 'PENDING'
                        ? () async {
                            await ref
                                .read(ownerProvider.notifier)
                                .rejectVisit(visit.id);

                            if (!context.mounted) return;

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Visit rejected')),
                            );
                          }
                        : null,

                    onComplete: visit.status == 'APPROVED'
                        ? () async {
                            await ref
                                .read(ownerProvider.notifier)
                                .completeVisit(visit.id);

                            if (!context.mounted) return;

                            ScaffoldMessenger.of(context).showSnackBar(
                              const SnackBar(content: Text('Visit completed')),
                            );
                          }
                        : null,
                  );
                },
              ),
      ),
    );
  }
}
