import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../providers/authentication_provider.dart';
import '../widgets/auth_header.dart';

class ForgotPasswordPage extends ConsumerStatefulWidget {
  const ForgotPasswordPage({super.key});

  @override
  ConsumerState<ForgotPasswordPage> createState() =>
      _ForgotPasswordPageState();
}

class _ForgotPasswordPageState extends ConsumerState<ForgotPasswordPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailController = TextEditingController();
  bool _sent = false;

  @override
  void dispose() {
    _emailController.dispose();
    super.dispose();
  }

  Future<void> _sendResetLink() async {
    FocusScope.of(context).unfocus();
    if (!_formKey.currentState!.validate()) return;

    final provider = ref.read(authenticationProvider);
    final success = await provider.forgotPassword(
      _emailController.text.trim(),
    );

    if (!mounted) return;

    if (success) {
      setState(() => _sent = true);
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('resetLinkSent')),
          backgroundColor: Colors.green,
        ),
      );
      return;
    }

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          provider.errorMessage ?? context.tr('unableRequestReset'),
        ),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(authenticationProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('forgotPassword'))),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 20),
                AuthHeader(
                  title: context.tr('forgotPassword'),
                  subtitle: context.tr('forgotPasswordSubtitle'),
                ),
                const SizedBox(height: 40),
                CustomTextField(
                  controller: _emailController,
                  hintText: context.tr('emailAddress'),
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    final email = value?.trim() ?? '';
                    if (email.isEmpty) return context.tr('enterYourEmail');
                    if (!RegExp(
                      r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,}$',
                    ).hasMatch(email)) {
                      return context.tr('validEmailAddress');
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 30),
                CustomButton(
                  text: _sent
                      ? context.tr('sendAgain')
                      : context.tr('sendResetLink'),
                  isLoading: provider.isLoading,
                  onPressed: _sendResetLink,
                ),
                if (_sent) ...[
                  const SizedBox(height: 16),
                  Text(
                    context.tr('checkResetInbox'),
                    textAlign: TextAlign.center,
                  ),
                ],
                const SizedBox(height: 20),
                TextButton(
                  onPressed: provider.isLoading
                      ? null
                      : () => Navigator.pop(context),
                  child: Text(context.tr('backToLogin')),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
