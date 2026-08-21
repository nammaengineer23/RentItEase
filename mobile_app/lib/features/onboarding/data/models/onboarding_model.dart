class OnboardingModel {
  final String title;
  final String description;
  final String image;

  const OnboardingModel({
    required this.title,
    required this.description,
    required this.image,
  });
}

const List<OnboardingModel> onboardingItems = [
  OnboardingModel(
    title: 'Find Your Perfect Home',
    description:
        'Browse thousands of verified rental properties with zero brokerage.',
    image: 'assets/images/onboarding/find_your_property_1080x1920.png',
  ),
  OnboardingModel(
    title: 'Book Property Visits',
    description:
        'Schedule property visits instantly and connect directly with owners.',
    image: 'assets/images/onboarding/easy_bookings_1080x1920.png',
  ),
  OnboardingModel(
    title: 'Rent with Confidence',
    description:
        'Secure payments, verified listings and hassle-free agreements all in one place.',
    image: 'assets/images/onboarding/secure_payments_1080x1920.png',
  ),
];
