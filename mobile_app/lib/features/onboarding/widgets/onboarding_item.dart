import 'package:flutter/material.dart';

import '../../../data/models/onboarding_model.dart';

class OnboardingItem extends StatelessWidget {
  final OnboardingModel item;

  const OnboardingItem({super.key, required this.item});

  @override
  Widget build(BuildContext context) {
    final size = MediaQuery.of(context).size;

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 20),
      child: Column(
        children: [
          const Spacer(),

          SizedBox(
            height: size.height * 0.38,
            child: Image.asset(item.image, fit: BoxFit.contain),
          ),

          const SizedBox(height: 50),

          Text(
            item.title,
            textAlign: TextAlign.center,
            style: Theme.of(
              context,
            ).textTheme.headlineMedium?.copyWith(fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 20),

          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 10),
            child: Text(
              item.description,
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                color: Colors.grey.shade600,
                height: 1.5,
              ),
            ),
          ),

          const Spacer(),
        ],
      ),
    );
  }
}
