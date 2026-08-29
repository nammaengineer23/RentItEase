import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

class VisitDatePicker extends StatefulWidget {
  const VisitDatePicker({super.key, required this.onChanged, this.initialDate});

  final ValueChanged<DateTime> onChanged;
  final DateTime? initialDate;

  @override
  State<VisitDatePicker> createState() => _VisitDatePickerState();
}

class _VisitDatePickerState extends State<VisitDatePicker> {
  late DateTime selectedDateTime;

  @override
  void initState() {
    super.initState();

    final now = DateTime.now();

    selectedDateTime =
        widget.initialDate ?? DateTime(now.year, now.month, now.day + 1, 10, 0);

    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (mounted) {
        widget.onChanged(selectedDateTime);
      }
    });
  }

  Future<void> pickDate() async {
    final now = DateTime.now();

    final picked = await showDatePicker(
      context: context,
      initialDate: selectedDateTime.isBefore(now) ? now : selectedDateTime,
      firstDate: DateTime(now.year, now.month, now.day),
      lastDate: DateTime(now.year + 1, now.month, now.day),
    );

    if (picked == null) {
      return;
    }

    setState(() {
      selectedDateTime = DateTime(
        picked.year,
        picked.month,
        picked.day,
        selectedDateTime.hour,
        selectedDateTime.minute,
      );
    });

    widget.onChanged(selectedDateTime);
  }

  Future<void> pickTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: TimeOfDay.fromDateTime(selectedDateTime),
    );

    if (picked == null) {
      return;
    }

    setState(() {
      selectedDateTime = DateTime(
        selectedDateTime.year,
        selectedDateTime.month,
        selectedDateTime.day,
        picked.hour,
        picked.minute,
      );
    });

    widget.onChanged(selectedDateTime);
  }

  String get formattedDate {
    return '${selectedDateTime.day.toString().padLeft(2, '0')}/'
        '${selectedDateTime.month.toString().padLeft(2, '0')}/'
        '${selectedDateTime.year}';
  }

  String get formattedTime {
    final hour = selectedDateTime.hour > 12
        ? selectedDateTime.hour - 12
        : selectedDateTime.hour == 0
        ? 12
        : selectedDateTime.hour;

    final minute = selectedDateTime.minute.toString().padLeft(2, '0');

    final period = selectedDateTime.hour >= 12 ? 'PM' : 'AM';

    return '$hour:$minute $period';
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              context.tr('preferredVisitSchedule'),
              style: const TextStyle(
                fontWeight: FontWeight.bold,
                fontSize: 18,
              ),
            ),

            const SizedBox(height: 20),

            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.calendar_today),
              title: Text(context.tr('visitDate')),
              subtitle: Text(formattedDate),
              trailing: const Icon(Icons.chevron_right),
              onTap: pickDate,
            ),

            const Divider(),

            ListTile(
              contentPadding: EdgeInsets.zero,
              leading: const Icon(Icons.access_time),
              title: Text(context.tr('visitTime')),
              subtitle: Text(formattedTime),
              trailing: const Icon(Icons.chevron_right),
              onTap: pickTime,
            ),
          ],
        ),
      ),
    );
  }
}
