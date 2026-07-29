import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/repositories/profile_repository_impl.dart';
import '../domain/entities/profile_entity.dart';
import '../domain/repositories/profile_repository.dart';

// Repository Provider

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  return ProfileRepositoryImpl();
});

// Profile State Provider

final profileProvider =
    StateNotifierProvider<ProfileNotifier, AsyncValue<ProfileEntity?>>((ref) {
      return ProfileNotifier(ref.read(profileRepositoryProvider));
    });

// Profile Notifier

class ProfileNotifier extends StateNotifier<AsyncValue<ProfileEntity?>> {
  final ProfileRepository repository;

  ProfileNotifier(this.repository) : super(const AsyncValue.loading()) {
    loadProfile();
  }

  // ==============================
  // Load Profile
  // ==============================

  Future<void> loadProfile() async {
    try {
      state = const AsyncValue.loading();

      final profile = await repository.getProfile();

      state = AsyncValue.data(profile);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  // ==============================
  // Update Profile
  // ==============================

  Future<void> updateProfile({
    required String fullName,

    required String phone,
  }) async {
    try {
      final updated = await repository.updateProfile(
        fullName: fullName,
        phone: phone,
      );

      state = AsyncValue.data(updated);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  // ==============================
  // Upload Profile Image
  // ==============================

  Future<void> uploadImage(String imagePath) async {
    final current = state.value;

    if (current == null) {
      return;
    }

    try {
      final imageUrl = await repository.uploadProfileImage(imagePath);

      state = AsyncValue.data(current.copyWith(profileImage: imageUrl));
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }

  // ==============================
  // Logout
  // ==============================

  Future<void> logout() async {
    try {
      await repository.logout();

      state = const AsyncValue.data(null);
    } catch (e, stack) {
      state = AsyncValue.error(e, stack);
    }
  }
}
