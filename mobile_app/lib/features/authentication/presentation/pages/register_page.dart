import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../../shared/widgets/custom_button.dart';
import '../../../../shared/widgets/custom_text_field.dart';
import '../../providers/authentication_provider.dart';
import '../widgets/auth_header.dart';
import '../widgets/password_strength.dart';

class RegisterPage extends ConsumerStatefulWidget {
  final VoidCallback onLogin;

  const RegisterPage({
    super.key,
    required this.onLogin,
  });

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
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    _passwordController.dispose();
    super.dispose();
  }

  Future<void> _register() async {
    if (!_formKey.currentState!.validate()) {
      return;
    }

    final provider = ref.read(authenticationProvider);

    final success = await provider.register(
      fullName: _nameController.text.trim(),
      email: _emailController.text.trim(),
      phone: _phoneController.text.trim(),
      password: _passwordController.text,
    );

    if (!mounted) return;

    if (success) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Registration Successful'),
        ),
      );

      widget.onLogin();
    } else {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            provider.errorMessage ?? 'Registration Failed',
          ),
        ),
      );
    }
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
                const SizedBox(height: 20),

                const AuthHeader(
                  title: 'Create Account',
                  subtitle:
                      'Join RentEase and start finding your perfect rental home.',
                ),

                const SizedBox(height: 35),

                CustomTextField(
                  controller: _nameController,
                  hintText: 'Full Name',
                  prefixIcon: Icons.person_outline,
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Enter your full name';
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
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Enter your email';
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
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Enter mobile number';
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
                    if (value == null || value.length < 8) {
                      return 'Minimum 8 characters required';
                    }
                    return null;
                  },
                ),

                const SizedBox(height: 16),

                PasswordStrength(
                  password: _passwordController.text,
                ),

                const SizedBox(height: 30),

                CustomButton(
                  text: 'Create Account',
                  isLoading: provider.isLoading,
                  onPressed: _register,
                ),

                const SizedBox(height: 20),

                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Text(
                      'Already have an account?',
                    ),
                    TextButton(
                      onPressed: widget.onLogin,
                      child: const Text(
                        'Login',
                      ),
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