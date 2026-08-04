import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../onboarding/services/onboarding_service.dart';
import '../../../authentication/providers/authentication_provider.dart';

class SplashPage extends ConsumerStatefulWidget
{
const SplashPage({super.key});

  @override
  ConsumerState<SplashPage> createState() => _SplashPageState();
}

class _SplashPageState extends ConsumerState<SplashPage>
{
  final OnboardingService _onboardingService = OnboardingService();

  @override
  void initState() 
{
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async
{
    await Future.delayed(const Duration(seconds: 2));

    final completed = await _onboardingService.isOnboardingCompleted();

if (!mounted) return;

if (!completed) 
{
      context.go('/onboarding');
      return;
    }

    await ref.read(authenticationProvider).loadSavedSession();
if (!mounted) return;
    context.go(ref.read(authenticationProvider).isLoggedIn ? '/home' : '/auth');
  }

  @override
  Widget build(BuildContext context) 
{
    return Scaffold(
      backgroundColor: Colors.white,
body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
children: [
            Image.asset('assets/images/logo.png', width: 120, height: 120),

const SizedBox(height: 30),

Text(
              'RentItEase',
style: Theme.of(
                context,
              ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
            ),

const SizedBox(height: 12),

Text(
              'Find your perfect rental home',
style: Theme.of(context).textTheme.bodyMedium,
            ),

const SizedBox(height: 60),

const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }
}
