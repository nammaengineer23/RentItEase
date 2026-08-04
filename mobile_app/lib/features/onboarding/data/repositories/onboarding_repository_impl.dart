import '../../domain/entities/onboarding_entity.dart';
import '../../domain/repositories/onboarding_repository.dart';

class OnboardingRepositoryImpl implements OnboardingRepository
{
  @override
  Future<List<OnboardingEntity>> load() async
{
    return [
      const OnboardingEntity('Track progress', 'Built for RentItEase workflows.'),
    ];
  }
}
