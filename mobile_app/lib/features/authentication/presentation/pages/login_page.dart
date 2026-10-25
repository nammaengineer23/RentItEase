import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';
import '../../../../l10n/app_localizations.dart';
import '../../../../core/utils/app_error_message.dart';
import '../../../../core/config/auth_features.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../providers/authentication_provider.dart';
import '../../services/firebase_phone_otp_service.dart';
import '../widgets/auth_header.dart';
import '../widgets/remember_me.dart';
import '../widgets/otp_code_dialog.dart';
import '../widgets/social_login_button.dart';

class LoginPage extends ConsumerStatefulWidget {
  final VoidCallback onRegister;

  const LoginPage({super.key, required this.onRegister});

  @override
  ConsumerState<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends ConsumerState<LoginPage> {
  final _formKey = GlobalKey<FormState>();

  final _emailController = TextEditingController();
  final _passwordController = TextEditingController();
  bool _rememberedEmailApplied = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    final provider = ref.read(authenticationProvider);
    final success = await provider.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;
    if (success) {
      TextInput.finishAutofillContext(shouldSave: true);
      _openAuthenticatedHome(provider);
      return;
    }

    _showError(provider.errorMessage ?? context.tr('loginFailed'));
  }

  void _openAuthenticatedHome(AuthenticationProvider provider) {
    final role = provider.authResponse?.user.role.trim().toUpperCase();
    switch (role) {
      case 'ADMIN':
        context.go('/admin/dashboard');
        break;
      case 'OWNER':
        context.go('/owner/dashboard');
        break;
      default:
        context.go('/home');
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Future<void> _googleLogin() async {
    final provider = ref.read(authenticationProvider);
    final success = await provider.signInWithGoogle();

    if (!mounted) return;

    if (success) {
      _openAuthenticatedHome(provider);
      return;
    }

    if (provider.errorMessage?.contains('Complete phone verification') ??
        false) {
      final controller = TextEditingController();
      final phone = await showDialog<String>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: const Text('Verify phone number'),
          content: TextField(
            controller: controller,
            keyboardType: TextInputType.phone,
            maxLength: 10,
            decoration: const InputDecoration(
              labelText: 'Indian mobile number',
              prefixText: '+91 ',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () =>
                  Navigator.pop(dialogContext, controller.text.trim()),
              child: const Text('Verify'),
            ),
          ],
        ),
      );
      if (!mounted || phone == null) return;
      if (!RegExp(r'^\d{10}$').hasMatch(phone)) {
        _showError('Enter a valid 10-digit phone number.');
        return;
      }
      try {
        final phoneToken = await FirebasePhoneOtpService().verifyPhone(
          phoneNumber: '+91$phone',
          requestCode: () => showOtpCodeDialog(
            context,
            title: context.tr('verifyPhoneNumber'),
            destination: '+91 $phone',
          ),
        );
        if (await provider.completeGoogleRegistration(phoneToken) && mounted) {
          _openAuthenticatedHome(provider);
          return;
        }
      } catch (error) {
        if (mounted) _showError(userFriendlyError(error));
        return;
      }
    }

    if (!mounted) return;

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          provider.errorMessage ?? context.tr('googleSignInFailed'),
        ),
        backgroundColor: Colors.red,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(authenticationProvider);

    if (!_rememberedEmailApplied && provider.rememberPreferenceLoaded) {
      _rememberedEmailApplied = true;
      final email = provider.rememberedEmail;
      if (email != null && email.isNotEmpty && _emailController.text.isEmpty) {
        _emailController.text = email;
        _emailController.selection = TextSelection.collapsed(
          offset: email.length,
        );
      }
    }

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: AutofillGroup(
              child: Column(
                children: [
                  const SizedBox(height: 12),
                  AuthHeader(
                    title: context.tr('welcomeBack'),
                    subtitle: context.tr('loginSubtitle'),
                  ),
                  const SizedBox(height: 12),
                  if (enableGoogleSignIn)
                    SocialLoginButton(
                      isLoading: provider.isLoading,
                      onPressed: _googleLogin,
                    ),
                  const SizedBox(height: 20),
                  CustomTextField(
                    controller: _emailController,
                    hintText: context.tr('emailAddress'),
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.username, AutofillHints.email],
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return context.tr('enterEmail');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 10),
                  CustomTextField(
                    controller: _passwordController,
                    hintText: context.tr('password'),
                    prefixIcon: Icons.lock_outline,
                    obscureText: provider.obscurePassword,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.password],
                    onFieldSubmitted: (_) => _login(),
                    suffixIcon: IconButton(
                      icon: Icon(
                        provider.obscurePassword
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                      onPressed: () {
                        ref.read(authenticationProvider).togglePasswordVisibility();
                      },
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return context.tr('enterPassword');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 6),
                  RememberMe(
                    onForgotPassword: () => context.push('/forgot-password'),
                  ),
                  const SizedBox(height: 12),
                  CustomButton(
                    text: context.tr('login'),
                    isLoading: provider.isLoading,
                    onPressed: _login,
                  ),
                  const SizedBox(height: 16),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(context.tr('noAccount')),
                      TextButton(
                        onPressed: widget.onRegister,
                        child: Text(context.tr('signUp')),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}
