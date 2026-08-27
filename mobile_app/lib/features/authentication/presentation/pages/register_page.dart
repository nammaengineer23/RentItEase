import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

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
      _showError(provider.errorMessage ?? 'Unable to send email OTP.');
      return;
    }

    final emailOtp = await showOtpCodeDialog(
      context,
      title: 'Verify Email',
      destination: email,
    );
    if (emailOtp == null || !mounted) return;

    final emailProof = await provider.verifySignupEmailOtp(email, emailOtp);
    if (!mounted) return;
    if (emailProof == null) {
      _showError(provider.errorMessage ?? 'Email verification failed.');
      return;
    }

    String phoneProof;
    try {
      phoneProof = await FirebasePhoneOtpService().verifyPhone(
        phoneNumber: '+91$phone',
        requestCode: () => showOtpCodeDialog(
          context,
          title: 'Verify Phone Number',
          destination: '+91 $phone',
        ),
      );
    } catch (error) {
      if (mounted) _showError('Phone verification failed: $error');
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
        const SnackBar(
          content: Text('Email and phone verified. Account created.'),
          backgroundColor: Colors.green,
        ),
      );
      context.go('/home');
      return;
    }

    _showError(provider.errorMessage ?? 'Registration failed.');
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

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(provider.errorMessage ?? 'Google signup failed'),
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
          padding: const EdgeInsets.all(24),
          child: AutofillGroup(
            child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 20),

                const AuthHeader(
                  title: 'Create Account',
                  subtitle:
                      'Join RentItEase and start finding your perfect rental home.',
                ),

                const SizedBox(height: 35),

                CustomTextField(
                  controller: _nameController,
                  hintText: 'Full Name',
                  prefixIcon: Icons.person_outline,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.name],
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter your full name';
                    }

                    if (value.trim().length < 3) {
                      return 'Name must be at least 3 characters';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 16),

                CustomTextField(
                  controller: _emailController,
                  hintText: 'Email Address',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.email],
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter your email';
                    }

                    final emailRegex = RegExp(
                      r'^[\w\.-]+@([\w-]+\.)+[\w-]{2,4}$',
                    );

                    if (!emailRegex.hasMatch(value.trim())) {
                      return 'Enter a valid email';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 16),

                CustomTextField(
                  controller: _phoneController,
                  hintText: 'Mobile Number',
                  prefixIcon: Icons.phone_outlined,
                  keyboardType: TextInputType.phone,
                  textInputAction: TextInputAction.next,
                  autofillHints: const [AutofillHints.telephoneNumber],
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Enter mobile number';
                    }

                    if (!RegExp(r'^[6-9]\d{9}$').hasMatch(value.trim())) {
                      return 'Enter a valid 10-digit mobile number';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 16),

                CustomTextField(
                  controller: _passwordController,
                  hintText: 'Password',
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
                      return 'Enter password';
                    }

                    if (value.length < 8) {
                      return 'Password must be at least 8 characters';
                    }

                    return null;
                  },
                ),

                const SizedBox(height: 16),

                PasswordStrength(password: _passwordController.text),

                const SizedBox(height: 30),

                CustomButton(
                  text: 'Create Account',
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
                    const Text('Already have an account?'),
                    TextButton(
                      onPressed: widget.onLogin,
                      child: const Text('Login'),
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
