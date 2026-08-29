import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../providers/authentication_provider.dart';

class RememberMe extends ConsumerWidget {
  final VoidCallback onForgotPassword;

  const RememberMe({super.key, required this.onForgotPassword});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(authenticationProvider);

    return Row(
      children: [
        Transform.scale(
          scale: 0.95,
          child: Checkbox(
            value: provider.rememberMe,
            activeColor: Theme.of(context).colorScheme.primary,
            onChanged: (value) {
              ref.read(authenticationProvider).setRememberMe(value ?? false);
            },
          ),
        ),

        Text(
          context.tr('rememberMe'),
          style: const TextStyle(fontSize: 15, fontWeight: FontWeight.w500),
        ),

        const Spacer(),

        TextButton(
          onPressed: onForgotPassword,
          child: Text(
            context.tr('forgotPasswordQuestion'),
            style: TextStyle(
              color: Theme.of(context).colorScheme.primary,
              fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ],
    );
  }
}
