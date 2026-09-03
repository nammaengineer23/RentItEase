import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';
import '../../../../l10n/app_localizations.dart';
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
  bool _useOtp = false;

  @override
  void dispose() {
    _emailController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _login() async {
    if (!_formKey.currentState!.validate()) return;

    if (_useOtp) {
      await _loginWithOtp();
      return;
    }

    final provider = ref.read(authenticationProvider);
    final success = await provider.login(
      email: _emailController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;
    if (success) {
      _openAuthenticatedHome(provider);
      return;
    }

    _showError(provider.errorMessage ?? context.tr('loginFailed'));
  }

  Future<void> _loginWithOtp() async {
    final provider = ref.read(authenticationProvider);
    final identifier = _emailController.text.trim();
    final digits = identifier.replaceAll(RegExp(r'\D'), '');
    if (identifier.contains('@') || digits.length != 10) {
      _showError('OTP login requires a valid 10-digit mobile number.');
      return;
    }

    bool success;
    try {
      final idToken = await FirebasePhoneOtpService().verifyPhone(
        phoneNumber: '+91$digits',
        requestCode: () => showOtpCodeDialog(
          context,
          title: context.tr('phoneOtpLogin'),
          destination: '+91 $digits',
        ),
      );
      success = await provider.loginWithPhoneOtp(idToken);
    } catch (error) {
      if (mounted) {
        _showError('${context.tr('phoneVerificationFailed')}: $error');
      }
      return;
    }

    if (!mounted) return;
    if (success) {
      _openAuthenticatedHome(provider);
      return;
    }

    _showError(provider.errorMessage ?? context.tr('otpLoginFailed'));
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
        if (mounted) _showError('Phone verification failed: $error');
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

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(16),
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 12),

                AuthHeader(
                  title: context.tr('welcomeBack'),
                  subtitle: context.tr('loginSubtitle'),
                ),

                const SizedBox(height: 12),

                SegmentedButton<bool>(
                  segments: [
                    ButtonSegment(
                      value: false,
                      icon: const Icon(Icons.password),
                      label: Text(context.tr('password')),
                    ),
                    ButtonSegment(
                      value: true,
                      icon: const Icon(Icons.sms_outlined),
                      label: Text(context.tr('otp')),
                    ),
                  ],
                  selected: {_useOtp},
                  onSelectionChanged: (selection) {
                    setState(() {
                      _useOtp = selection.first;
                      _emailController.clear();
                    });
                  },
                ),

                const SizedBox(height: 12),

                CustomTextField(
                  controller: _emailController,
                  hintText: _useOtp
                      ? '10-digit mobile number'
                      : context.tr('emailOrMobile'),
                  prefixIcon: _useOtp
                      ? Icons.phone_outlined
                      : Icons.email_outlined,
                  keyboardType: _useOtp
                      ? TextInputType.phone
                      : TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return _useOtp
                          ? 'Enter your 10-digit mobile number.'
                          : context.tr('enterEmail');
                    }
                    if (_useOtp &&
                        !RegExp(r'^\d{10}$').hasMatch(value.trim())) {
                      return 'Enter a valid 10-digit mobile number.';
                    }
                    return null;
                  },
                ),

                if (!_useOtp) ...[
                  const SizedBox(height: 10),
                  CustomTextField(
                    controller: _passwordController,
                    hintText: context.tr('password'),
                    prefixIcon: Icons.lock_outline,
                    obscureText: provider.obscurePassword,
                    suffixIcon: IconButton(
                      icon: Icon(
                        provider.obscurePassword
                            ? Icons.visibility
                            : Icons.visibility_off,
                      ),
                      onPressed: () {
                        ref
                            .read(authenticationProvider)
                            .togglePasswordVisibility();
                      },
                    ),
                    validator: (value) {
                      if (!_useOtp && (value == null || value.isEmpty)) {
                        return context.tr('enterPassword');
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 6),
                  RememberMe(
                    onForgotPassword: () => context.push('/forgot-password'),
                  ),
                ],

                const SizedBox(height: 12),

                CustomButton(
                  text: _useOtp ? context.tr('sendOtp') : context.tr('login'),
                  isLoading: provider.isLoading,
                  onPressed: _login,
                ),

                const SizedBox(height: 12),

                SocialLoginButton(
                  isLoading: provider.isLoading,
                  onPressed: _googleLogin,
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
    );
  }
}
