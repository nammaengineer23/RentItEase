import 'package:flutter/material.dart';

class TimeSlotSelector extends StatelessWidget {
  final List<String> timeSlots;
  final String? selectedSlot;
  final ValueChanged<String> onSlotSelected;

  const TimeSlotSelector({
    super.key,
    required this.timeSlots,
    required this.selectedSlot,
    required this.onSlotSelected,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'Available Time Slots',
          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                fontWeight: FontWeight.bold,
              ),
        ),

        const SizedBox(height: 14),

        Wrap(
          spacing: 10,
          runSpacing: 10,
          children: timeSlots.map((slot) {
            final isSelected = slot == selectedSlot;

            return ChoiceChip(
              label: Text(slot),
              selected: isSelected,
              onSelected: (_) => onSlotSelected(slot),
              selectedColor:
                  Theme.of(context).colorScheme.primary,
              backgroundColor: Colors.grey.shade100,
              labelStyle: TextStyle(
                color: isSelected
                    ? Colors.white
                    : Colors.black87,
                fontWeight: FontWeight.w600,
              ),
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(24),
              ),
            );
          }).toList(),
        ),
      ],
    );
  }
}