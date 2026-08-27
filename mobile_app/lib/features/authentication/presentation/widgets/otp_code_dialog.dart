import 'package:flutter/material.dart';

Future<String?> showOtpCodeDialog(
  BuildContext context, {
  required String title,
  required String destination,
}) {
  final controller = TextEditingController();

  return showDialog<String>(
    context: context,
    barrierDismissible: false,
    builder: (dialogContext) => AlertDialog(
      title: Text(title),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Enter the 6-digit code sent to $destination.'),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            autofocus: true,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: const InputDecoration(
              labelText: 'Verification code',
              border: OutlineInputBorder(),
              counterText: '',
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: const Text('Cancel'),
        ),
        FilledButton(
          onPressed: () {
            final code = controller.text.trim();
            if (RegExp(r'^\d{6}$').hasMatch(code)) {
              Navigator.of(dialogContext).pop(code);
            }
          },
          child: const Text('Verify'),
        ),
      ],
    ),
  ).whenComplete(controller.dispose);
}
