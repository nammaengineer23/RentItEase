import 'package:flutter/material.dart';

class VisitDatePicker extends StatefulWidget {
  final ValueChanged<DateTime> onChanged;

  final DateTime? initialDate;

  const VisitDatePicker({super.key, required this.onChanged, this.initialDate});

  @override
  State<VisitDatePicker> createState() => _VisitDatePickerState();
}

class _VisitDatePickerState extends State<VisitDatePicker> {
  late DateTime selectedDateTime;

  @override
  void initState() {
    super.initState();

    selectedDateTime =
        widget.initialDate ?? DateTime.now().add(const Duration(days: 1));

    WidgetsBinding.instance.addPostFrameCallback((_) {
      widget.onChanged(selectedDateTime);
    });
  }

  Future<void> pickDate() async {
    final picked = await showDatePicker(
      context: context,

      initialDate: selectedDateTime,

      firstDate: DateTime.now(),

      lastDate: DateTime.now().add(const Duration(days: 365)),
    );

    if (picked == null) return;

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

    if (picked == null) return;

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
    return "${selectedDateTime.day.toString().padLeft(2, '0')}/"
        "${selectedDateTime.month.toString().padLeft(2, '0')}/"
        "${selectedDateTime.year}";
  }

  String get formattedTime {
    final hour = selectedDateTime.hour > 12
        ? selectedDateTime.hour - 12
        : (selectedDateTime.hour == 0 ? 12 : selectedDateTime.hour);

    final minute = selectedDateTime.minute.toString().padLeft(2, '0');

    final period = selectedDateTime.hour >= 12 ? "PM" : "AM";

    return "$hour:$minute $period";
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
            const Text(
              "Preferred Visit Schedule",
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 18),
            ),

            const SizedBox(height: 20),

            ListTile(
              leading: const Icon(Icons.calendar_today),

              title: const Text("Visit Date"),

              subtitle: Text(formattedDate),

              trailing: const Icon(Icons.chevron_right),

              onTap: pickDate,
            ),

            const Divider(),

            ListTile(
              leading: const Icon(Icons.access_time),

              title: const Text("Visit Time"),

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
