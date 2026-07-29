import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/property_visit_provider.dart';
import '../widgets/visit_date_picker.dart';

class BookVisitPage extends ConsumerStatefulWidget {
  final String propertyId;
  final String propertyTitle;
  final String propertyImage;
  final String ownerName;

  const BookVisitPage({
    super.key,
    required this.propertyId,
    required this.propertyTitle,
    required this.propertyImage,
    required this.ownerName,
  });

  @override
  ConsumerState<BookVisitPage> createState() => _BookVisitPageState();
}

class _BookVisitPageState extends ConsumerState<BookVisitPage> {
  final notesController = TextEditingController();

  DateTime? visitDate;

  bool loading = false;

  Future<void> bookVisit() async {
    if (visitDate == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select visit date.')),
      );

      return;
    }

    setState(() {
      loading = true;
    });

    try {
      await ref
          .read(propertyVisitProvider.notifier)
          .bookVisit(
            propertyId: widget.propertyId,
            visitDate: visitDate!,
            notes: notesController.text.trim(),
          );

      if (!mounted) return;

      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Visit booked successfully 🎉')),
      );

      Navigator.pop(context);
    } catch (e) {
      if (!mounted) return;

      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() {
          loading = false;
        });
      }
    }
  }

  @override
  void dispose() {
    notesController.dispose();

    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Book Property Visit')),

      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),

        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,

          children: [
            Card(
              clipBehavior: Clip.antiAlias,

              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  AspectRatio(
                    aspectRatio: 16 / 9,

                    child: Image.network(
                      widget.propertyImage,

                      fit: BoxFit.cover,

                      errorBuilder: (_, __, ___) {
                        return Container(
                          color: Colors.grey.shade300,

                          child: const Center(
                            child: Icon(Icons.home, size: 70),
                          ),
                        );
                      },
                    ),
                  ),

                  Padding(
                    padding: const EdgeInsets.all(16),

                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,

                      children: [
                        Text(
                          widget.propertyTitle,

                          style: const TextStyle(
                            fontSize: 22,

                            fontWeight: FontWeight.bold,
                          ),
                        ),

                        const SizedBox(height: 10),

                        Row(
                          children: [
                            const Icon(Icons.person),

                            const SizedBox(width: 8),

                            Expanded(child: Text(widget.ownerName)),
                          ],
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 25),

            VisitDatePicker(
              onChanged: (date) {
                visitDate = date;
              },
            ),

            const SizedBox(height: 25),

            TextField(
              controller: notesController,

              maxLines: 4,

              decoration: const InputDecoration(
                labelText: 'Notes (Optional)',

                hintText: 'Preferred time, instructions...',

                border: OutlineInputBorder(),
              ),
            ),

            const SizedBox(height: 35),

            SizedBox(
              width: double.infinity,

              height: 55,

              child: ElevatedButton.icon(
                icon: loading
                    ? const SizedBox(
                        width: 22,

                        height: 22,

                        child: CircularProgressIndicator(
                          strokeWidth: 2,

                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.calendar_month),

                label: Text(loading ? 'Booking...' : 'Book Visit'),

                onPressed: loading ? null : bookVisit,
              ),
            ),

            const SizedBox(height: 30),
          ],
        ),
      ),
    );
  }
}
