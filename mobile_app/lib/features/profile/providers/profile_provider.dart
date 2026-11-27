import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';

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

  return ProfileRepositoryImpl(ProfileApi(dio));
});

// ============================================================
// PROFILE PROVIDER
// ============================================================

final profileProvider =
    StateNotifierProvider.autoDispose<
      ProfileNotifier,
      AsyncValue<ProfileEntity?>
    >((ref) {
      return ProfileNotifier(ref, ref.read(profileRepositoryProvider));
    });

// ============================================================
// PROFILE NOTIFIER
// ============================================================

class ProfileNotifier extends StateNotifier<AsyncValue<ProfileEntity?>> {
  ProfileNotifier(this._ref, this._repository) : super(const AsyncLoading()) {
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
  }) async {
    final current = state.value;

    try {
      final updated = await _repository.updateProfile(
        fullName: fullName,
        phone: phone,
      );

      state = AsyncData(updated);
    } catch (e) {
      if (current != null) {
        state = AsyncData(current);
      }
      rethrow;
    }
  }

  // ============================================================
  // UPLOAD PROFILE IMAGE
  // ============================================================

  Future<void> uploadImage(XFile image) async {
    final current = state.value;

    if (current == null) {
      throw Exception('Profile is not loaded. Please try again.');
    }

    try {
      final imageUrl = await _repository.uploadProfileImage(image);

      if (imageUrl.isEmpty) {
        throw Exception('Profile image upload did not return an image URL.');
      }

      final updated = current.copyWith(profileImage: imageUrl);

      state = AsyncData(updated);
    } catch (e) {
      state = AsyncData(current);
      rethrow;
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
