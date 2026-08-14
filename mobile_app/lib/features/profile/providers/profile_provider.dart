import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/dio_provider.dart';
import '../../authentication/providers/authentication_provider.dart';

import '../data/profile_api.dart';
import '../data/profile_repository.dart';

import '../domain/entities/profile_entity.dart';
import '../domain/repositories/profile_repository.dart';

// ============================================================
// PROFILE REPOSITORY PROVIDER
// ============================================================

final profileRepositoryProvider = Provider<ProfileRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return ProfileRepositoryImpl(
    ProfileApi(dio),
  );
});

// ============================================================
// PROFILE PROVIDER
// ============================================================

final profileProvider =
    StateNotifierProvider<ProfileNotifier, AsyncValue<ProfileEntity?>>((ref) {
      return ProfileNotifier(
        ref,
        ref.read(profileRepositoryProvider),
      );
    });

// ============================================================
// PROFILE NOTIFIER
// ============================================================

class ProfileNotifier extends StateNotifier<AsyncValue<ProfileEntity?>> {
  ProfileNotifier(
    this._ref,
    this._repository,
  ) : super(const AsyncLoading()) {
    loadProfile();
  }

  final Ref _ref;
  final ProfileRepository _repository;

  // ============================================================
  // LOAD PROFILE
  // ============================================================

  Future<void> loadProfile() async {
    try {
      state = const AsyncLoading();

      final profile = await _repository.getProfile();

      state = AsyncData(profile);
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  Future<void> updateProfile({
    required String fullName,
    required String phone,
    String? photoUrl,
  }) async {
    try {
      final updated = await _repository.updateProfile(
        fullName: fullName,
        phone: phone,
        photoUrl: photoUrl,
      );

      state = AsyncData(updated);
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }

  // ============================================================
  // UPLOAD PROFILE IMAGE
  // ============================================================

  Future<void> uploadImage(String imagePath) async {
    final current = state.value;

    if (current == null) {
      return;
    }

    try {
      final imageUrl = await _repository.uploadProfileImage(imagePath);

      if (imageUrl.isEmpty) {
        throw Exception(
          'Profile image upload did not return an image URL.',
        );
      }

      final updated = current.copyWith(
        profileImage: imageUrl,
      );

      state = AsyncData(updated);

      // Persist the uploaded image URL to the backend.
      final persisted = await _repository.updateProfile(
        fullName: updated.fullName,
        phone: updated.phone,
        photoUrl: imageUrl,
      );

      state = AsyncData(persisted);
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }

  // ============================================================
  // REFRESH
  // ============================================================

  Future<void> refresh() async {
    await loadProfile();
  }

  // ============================================================
  // LOGOUT
  //
  // AuthenticationProvider performs:
  //
  // POST /auth/logout
  // StorageService.clearTokens()
  // _authResponse = null
  //
  // We then clear the Profile provider as well.
  // ============================================================

  Future<void> logout() async {
    try {
      await _ref.read(authenticationProvider).logout();

      state = const AsyncData(null);
    } catch (e, stackTrace) {
      state = AsyncError(e, stackTrace);
    }
  }

  // ============================================================
  // CLEAR LOCAL PROFILE STATE
  // ============================================================

  void clear() {
    state = const AsyncData(null);
  }
}