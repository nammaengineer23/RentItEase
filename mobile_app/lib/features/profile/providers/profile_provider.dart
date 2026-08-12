import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';

import '../data/profile_api.dart';
import '../data/profile_repository.dart';

import '../domain/entities/profile_entity.dart';
import '../domain/repositories/profile_repository.dart';

//======================================================
// Repository Provider
//======================================================

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return ProfileRepositoryImpl(ProfileApi(dio));
});

//======================================================
// Profile Provider
//======================================================

final profileProvider =
    StateNotifierProvider<ProfileNotifier, AsyncValue<ProfileEntity?>>((ref) {
      return ProfileNotifier(ref.read(profileRepositoryProvider));
    });

//======================================================
// Profile Notifier
//======================================================

class ProfileNotifier extends StateNotifier<AsyncValue<ProfileEntity?>> {
  ProfileNotifier(this._repository) : super(const AsyncLoading()) {
    loadProfile();
  }

  final ProfileRepository _repository;

  //======================================================
  // Load Profile
  //======================================================

  Future<void> loadProfile() async {
    try {
      state = const AsyncLoading();

      final profile = await _repository.getProfile();

      state = AsyncData(profile);
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }

  //======================================================
  // Update Profile
  //======================================================

  Future<void> updateProfile({
    required String fullName,
    required String phone,
  }) async {
    try {
      final updated = await _repository.updateProfile(
        fullName: fullName,
        phone: phone,
      );

      state = AsyncData(updated);
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }

  //======================================================
  // Upload Profile Image
  //======================================================

  Future<void> uploadImage(String imagePath) async {
    final current = state.value;

    if (current == null) return;

    try {
      final imageUrl = await _repository.uploadProfileImage(imagePath);

      state = AsyncData(current.copyWith(profileImage: imageUrl));
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }

  //======================================================
  // Refresh
  //======================================================

  Future<void> refresh() async {
    await loadProfile();
  }

  //======================================================
  // Logout
  //======================================================

  Future<void> logout() async {
    try {
      await _repository.logout();

      state = const AsyncData(null);
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }
}
