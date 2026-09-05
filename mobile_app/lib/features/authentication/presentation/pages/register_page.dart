import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../../core/utils/app_error_message.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_localizations.dart';
import '../../../../shared/widgets/custom_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../providers/authentication_provider.dart';
import '../../services/firebase_phone_otp_service.dart';
import '../widgets/auth_header.dart';
import '../widgets/password_strength.dart';
import '../widgets/otp_code_dialog.dart';
import '../widgets/social_login_button.dart';

class RegisterPage extends ConsumerStatefulWidget {
  final VoidCallback onLogin;

  const RegisterPage({super.key, required this.onLogin});

  @override
  ConsumerState<RegisterPage> createState() => _RegisterPageState();
}

class _RegisterPageState extends ConsumerState<RegisterPage> {
  final _formKey = GlobalKey<FormState>();

  final _nameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  final _passwordController = TextEditingController();

  @override
  void initState() {
    super.initState();
    _passwordController.addListener(() {
      if (mounted) {
        setState(() {});
      }
    });
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    FocusScope.of(context).unfocus();

    if (!_formKey.currentState!.validate()) return;

    final provider = ref.read(authenticationProvider);
    final email = _emailController.text.trim().toLowerCase();
    final phone = _phoneController.text.trim();

    final emailSent = await provider.requestSignupEmailOtp(email);
    if (!mounted) return;
    if (!emailSent) {
      _showError(provider.errorMessage ?? context.tr('unableSendEmailOtp'));
      return;
    }

    final emailOtp = await showOtpCodeDialog(
      context,
      title: context.tr('verifyEmail'),
      destination: email,
    );
    if (emailOtp == null || !mounted) return;

    final emailProof = await provider.verifySignupEmailOtp(email, emailOtp);
    if (!mounted) return;
    if (emailProof == null) {
      _showError(
        provider.errorMessage ?? context.tr('emailVerificationFailed'),
      );
      return;
    }

    String phoneProof;
    try {
      phoneProof = await FirebasePhoneOtpService().verifyPhone(
        phoneNumber: '+91$phone',
        requestCode: () => showOtpCodeDialog(
          context,
          title: context.tr('verifyPhoneNumber'),
          destination: '+91 $phone',
        ),
      );
    } catch (error) {
      if (mounted) {
        _showError(userFriendlyError(error));
      }
      return;
    }

    final success = await provider.registerVerified(
      fullName: _nameController.text.trim(),
      email: email,
      phone: phone,
      password: _passwordController.text,
      emailVerificationToken: emailProof,
      phoneIdToken: phoneProof,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(context.tr('accountCreated')),
          backgroundColor: Colors.green,
        ),
      );
      context.go('/home');
      return;
    }

    _showError(provider.errorMessage ?? context.tr('registrationFailed'));
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  Future<void> _googleRegister() async {
    final provider = ref.read(authenticationProvider);
    final success = await provider.signInWithGoogle();

    if (!mounted) return;

    if (success) {
      final role = provider.authResponse?.user.role.trim().toUpperCase();
      context.go(role == 'OWNER' ? '/owner/dashboard' : '/home');
      return;
    }

    final needsPhoneVerification =
        provider.errorMessage?.contains('Complete phone verification') ?? false;
    if (needsPhoneVerification) {
      final phone = _phoneController.text.trim();
      if (!RegExp(r'^\d{10}$').hasMatch(phone)) {
        _showError(context.tr('googlePhoneInstruction'));
        return;
      }

      try {
        final phoneProof = await FirebasePhoneOtpService().verifyPhone(
          phoneNumber: '+91$phone',
          requestCode: () => showOtpCodeDialog(
            context,
            title: context.tr('verifyPhoneNumber'),
            destination: '+91 $phone',
          ),
        );
        final created = await provider.completeGoogleRegistration(phoneProof);
        if (!mounted) return;
        if (created) {
          context.go('/home');
          return;
        }
      } catch (error) {
        if (!mounted) return;
        _showError(userFriendlyError(error));
        return;
      }
    }

    _showError(provider.errorMessage ?? context.tr('googleSignupFailed'));
  }

  @override
  Widget build(BuildContext context) {
    final provider = ref.watch(authenticationProvider);

    return Scaffold(
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24),
          child: AutofillGroup(
            child: Form(
              key: _formKey,
              child: Column(
                children: [
                  const SizedBox(height: 20),

                  AuthHeader(
                    title: context.tr('createAccount'),
                    subtitle: context.tr('registerSubtitle'),
                  ),

                  const SizedBox(height: 35),

                  CustomTextField(
                    controller: _nameController,
                    hintText: context.tr('fullName'),
                    prefixIcon: Icons.person_outline,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.name],
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return context.tr('enterFullName');
                      }

                      if (value.trim().length < 3) {
                        return context.tr('nameMinimum');
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  CustomTextField(
                    controller: _emailController,
                    hintText: context.tr('emailAddress'),
                    prefixIcon: Icons.email_outlined,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.email],
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return context.tr('enterYourEmail');
                      }

                      final emailRegex = RegExp(
                        r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$',
                      );

                      if (!emailRegex.hasMatch(value.trim())) {
                        return context.tr('validEmail');
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  CustomTextField(
                    controller: _phoneController,
                    hintText: context.tr('mobileNumber'),
                    prefixIcon: Icons.phone_outlined,
                    keyboardType: TextInputType.phone,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.telephoneNumber],
                    validator: (value) {
                      if (value == null || value.trim().isEmpty) {
                        return context.tr('enterMobileNumber');
                      }

                      if (!RegExp(r'^[6-9]\d{9}$').hasMatch(value.trim())) {
                        return context.tr('validMobileNumber');
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  CustomTextField(
                    controller: _passwordController,
                    hintText: context.tr('password'),
                    prefixIcon: Icons.lock_outline,
                    obscureText: provider.obscurePassword,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.newPassword],
                    onFieldSubmitted: (_) => _register(),
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
                      if (value == null || value.isEmpty) {
                        return context.tr('enterPasswordShort');
                      }

                      if (value.length < 8) {
                        return context.tr('passwordMinimum8');
                      }

                      return null;
                    },
                  ),

                  const SizedBox(height: 16),

                  PasswordStrength(password: _passwordController.text),

                  const SizedBox(height: 30),

                  CustomButton(
                    text: context.tr('createAccount'),
                    isLoading: provider.isLoading,
                    onPressed: _register,
                  ),

                  const SizedBox(height: 20),

                  SocialLoginButton(
                    isLoading: provider.isLoading,
                    onPressed: _googleRegister,
                  ),

                  const SizedBox(height: 20),

                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Text(context.tr('alreadyHaveAccount')),
                      TextButton(
                        onPressed: widget.onLogin,
                        child: Text(context.tr('login')),
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
