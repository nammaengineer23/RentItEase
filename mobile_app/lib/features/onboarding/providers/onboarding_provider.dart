import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../services/onboarding_service.dart';

final onboardingProvider = ChangeNotifierProvider<OnboardingProvider>((ref) {
  return OnboardingProvider();
});

class OnboardingProvider extends ChangeNotifier {
  final PageController pageController = PageController();

  final OnboardingService _service = OnboardingService();

  int _currentPage = 0;

  int get currentPage => _currentPage;

  bool get isLastPage => _currentPage == 2;

  void onPageChanged(int index) {
    _currentPage = index;
    notifyListeners();
  }

  Future<void> nextPage() async {
    if (_currentPage < 2) {
      pageController.nextPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> previousPage() async {
    if (_currentPage > 0) {
      pageController.previousPage(
        duration: const Duration(milliseconds: 350),
        curve: Curves.easeInOut,
      );
    }
  }

  Future<void> skip() async {
    pageController.animateToPage(
      2,
      duration: const Duration(milliseconds: 400),
      curve: Curves.easeInOut,
    );
  }

  Future<void> completeOnboarding() async {
    await _service.completeOnboarding();
  }

  Future<bool> isCompleted() async {
    return _service.isOnboardingCompleted();
  }

  @override
  void dispose() {
    pageController.dispose();
    super.dispose();
  }
}
