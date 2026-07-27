import 'package:flutter/material.dart';

import '../widgets/date_selector.dart';
import '../widgets/time_slot_selector.dart';

class BookingPage extends StatefulWidget {
  const BookingPage({super.key});

  @override
  State<BookingPage> createState() => _BookingPageState();
}

class _BookingPageState extends State<BookingPage> {
  DateTime _selectedDate = DateTime.now();

  String? _selectedTime;

  final List<String> _timeSlots = const [
    '09:00 AM',
    '10:30 AM',
    '12:00 PM',
    '02:00 PM',
    '03:30 PM',
    '05:00 PM',
  ];

  final TextEditingController _notesController =
      TextEditingController();

  @override
  void dispose() {
    _notesController.dispose();
    super.dispose();
  }

  void _bookVisit() {
    if (_selectedTime == null) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Please select a time slot'),
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Visit booked successfully'),
      ),
    );

    // TODO:
    // Call backend
    //
    // POST /api/v1/property-visits
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Book Property Visit'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [

            const Text(
              'Choose Visit Date',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 14),

            DateSelector(
              selectedDate: _selectedDate,
              onDateSelected: (date) {
                setState(() {
                  _selectedDate = date;
                });
              },
            ),

            const SizedBox(height: 30),

            TimeSlotSelector(
              timeSlots: _timeSlots,
              selectedSlot: _selectedTime,
              onSlotSelected: (slot) {
                setState(() {
                  _selectedTime = slot;
                });
              },
            ),

            const SizedBox(height: 30),

            const Text(
              'Notes (Optional)',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 12),

            TextField(
              controller: _notesController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText:
                    'Any special instructions...',
                border: OutlineInputBorder(
                  borderRadius:
                      BorderRadius.circular(14),
                ),
              ),
            ),

            const SizedBox(height: 40),

            SizedBox(
              width: double.infinity,
              child: FilledButton.icon(
                onPressed: _bookVisit,
                icon: const Icon(Icons.calendar_month),
                label: const Text(
                  'Book Visit',
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}