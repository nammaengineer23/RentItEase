import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'package:go_router/go_router.dart';
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

    _showError(provider.errorMessage ?? 'Login failed');
  }

  Future<void> _loginWithOtp() async {
    final provider = ref.read(authenticationProvider);
    final identifier = _emailController.text.trim();

    bool success;
    if (identifier.contains('@')) {
      final sent = await provider.requestLoginEmailOtp(
        identifier.toLowerCase(),
      );
      if (!mounted) return;
      if (!sent) {
        _showError(provider.errorMessage ?? 'Unable to send login OTP.');
        return;
      }

      final otp = await showOtpCodeDialog(
        context,
        title: 'Email OTP Login',
        destination: identifier,
      );
      if (otp == null || !mounted) return;

      success = await provider.loginWithEmailOtp(
        identifier.toLowerCase(),
        otp,
      );
    } else {
      final digits = identifier.replaceAll(RegExp(r'\D'), '');
      if (digits.length != 10) {
        _showError('Enter a valid email or 10-digit mobile number.');
        return;
      }

      try {
        final idToken = await FirebasePhoneOtpService().verifyPhone(
          phoneNumber: '+91$digits',
          requestCode: () => showOtpCodeDialog(
            context,
            title: 'Phone OTP Login',
            destination: '+91 $digits',
          ),
        );
        success = await provider.loginWithPhoneOtp(idToken);
      } catch (error) {
        if (mounted) _showError('Phone verification failed: $error');
        return;
      }
    }

    if (!mounted) return;
    if (success) {
      _openAuthenticatedHome(provider);
      return;
    }

    _showError(provider.errorMessage ?? 'OTP login failed.');
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

    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(provider.errorMessage ?? 'Google sign-in failed'),
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
          child: Form(
            key: _formKey,
            child: Column(
              children: [
                const SizedBox(height: 30),

                const AuthHeader(
                  title: 'Welcome Back',
                  subtitle: 'Login to continue your rental journey.',
                ),

                const SizedBox(height: 24),

                SegmentedButton<bool>(
                  segments: const [
                    ButtonSegment(
                      value: false,
                      icon: Icon(Icons.password),
                      label: Text('Password'),
                    ),
                    ButtonSegment(
                      value: true,
                      icon: Icon(Icons.sms_outlined),
                      label: Text('OTP'),
                    ),
                  ],
                  selected: {_useOtp},
                  onSelectionChanged: (selection) {
                    setState(() => _useOtp = selection.first);
                  },
                ),

                const SizedBox(height: 24),

                CustomTextField(
                  controller: _emailController,
                  hintText: 'Email Address or Mobile Number',
                  prefixIcon: Icons.email_outlined,
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Please enter email';
                    }

                    return null;
                  },
                ),

                if (!_useOtp) ...[
                  const SizedBox(height: 20),
                  CustomTextField(
                    controller: _passwordController,
                    hintText: 'Password',
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
                        return 'Please enter password';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 8),
                  RememberMe(
                    onForgotPassword: () =>
                        context.push('/forgot-password'),
                  ),
                ],

                const SizedBox(height: 24),

                CustomButton(
                  text: _useOtp ? 'Send OTP' : 'Login',
                  isLoading: provider.isLoading,
                  onPressed: _login,
                ),

                const SizedBox(height: 24),

                SocialLoginButton(
                  isLoading: provider.isLoading,
                  onPressed: _googleLogin,
                ),

                const SizedBox(height: 30),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text("Don't have an account?"),
                    TextButton(
                      onPressed: widget.onRegister,
                      child: const Text('Sign Up'),
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
