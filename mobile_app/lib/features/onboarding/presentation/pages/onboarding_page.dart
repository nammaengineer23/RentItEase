import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../data/models/onboarding_model.dart';
import '../../providers/onboarding_provider.dart';
import '../widgets/onboarding_item.dart';
import '../widgets/page_indicator.dart';

class OnboardingPage extends ConsumerWidget {
  const OnboardingPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final provider = ref.watch(onboardingProvider);

    return Scaffold(
      backgroundColor: Colors.white,
      body: SafeArea(
        child: Column(
          children: [
            //------------------------------------------
            // Skip Button
            //------------------------------------------
            Padding(
              padding: const EdgeInsets.symmetric(
                horizontal: 20,
                vertical: 10,
              ),
              child: Align(
                alignment: Alignment.centerRight,
                child: provider.isLastPage
                    ? const SizedBox.shrink()
                    : TextButton(
                        onPressed: () {
                          ref
                              .read(onboardingProvider)
                              .skip();
                        },
                        child: const Text(
                          'Skip',
                          style: TextStyle(
                            fontSize: 16,
                          ),
                        ),
                      ),
              ),
            ),

            //------------------------------------------
            // PageView
            //------------------------------------------
            Expanded(
              child: PageView.builder(
                controller: provider.pageController,
                itemCount: onboardingItems.length,
                onPageChanged: ref
                    .read(onboardingProvider)
                    .onPageChanged,
                itemBuilder: (context, index) {
                  return OnboardingItem(
                    item: onboardingItems[index],
                  );
                },
              ),
            ),

            //------------------------------------------
            // Indicator
            //------------------------------------------
            Padding(
              padding: const EdgeInsets.only(
                bottom: 25,
              ),
              child: PageIndicator(
                currentPage: provider.currentPage,
                itemCount: onboardingItems.length,
              ),
            ),

            //------------------------------------------
            // Buttons
            //------------------------------------------
            Padding(
              padding: const EdgeInsets.fromLTRB(
                24,
                0,
                24,
                35,
              ),
              child: SizedBox(
                width: double.infinity,
                height: 55,
                child: ElevatedButton(
                  onPressed: () async {
                    if (provider.isLastPage) {
                      await ref
                          .read(onboardingProvider)
                          .completeOnboarding();

                      if (context.mounted) {
                        context.go('/login');
                      }
                    } else {
                      ref
                          .read(onboardingProvider)
                          .nextPage();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    elevation: 0,
                    backgroundColor:
                        Theme.of(context)
                            .colorScheme
                            .primary,
                    foregroundColor: Colors.white,
                    shape: RoundedRectangleBorder(
                      borderRadius:
                          BorderRadius.circular(16),
                    ),
                  ),
                  child: Text(
                    provider.isLastPage
                        ? 'Get Started'
                        : 'Next',
                    style: const TextStyle(
                      fontSize: 17,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}