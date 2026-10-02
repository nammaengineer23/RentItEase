import 'package:flutter/material.dart';
import '../../../../l10n/app_localizations.dart';

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
          Text(
            dialogContext
                .tr('otpInstruction')
                .replaceFirst('{destination}', destination),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: controller,
            autofocus: true,
            keyboardType: TextInputType.number,
            maxLength: 6,
            decoration: InputDecoration(
              labelText: dialogContext.tr('verificationCode'),
              border: const OutlineInputBorder(),
              counterText: '',
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.of(dialogContext).pop(),
          child: Text(dialogContext.tr('cancel')),
        ),
        FilledButton(
          onPressed: () {
            final code = controller.text.trim();
            if (RegExp(r'^\d{6}$').hasMatch(code)) {
              Navigator.of(dialogContext).pop(code);
            }
          },
          child: Text(dialogContext.tr('verify')),
        ),
      ],
    ),
  ).whenComplete(controller.dispose);
}
