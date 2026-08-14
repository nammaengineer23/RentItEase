import '../domain/entities/profile_entity.dart';
import '../domain/repositories/profile_repository.dart';

import 'models/profile_model.dart';
import 'profile_api.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._api);

  final ProfileApi _api;

  @override
  Future<ProfileEntity> getProfile() async {
    final ProfileModel model = await _api.getProfile();
    return model.toEntity();
  }

  @override
  Future<ProfileEntity> updateProfile({
    required String fullName,
    required String phone,
    String? photoUrl,
  }) async {
    final ProfileModel model = await _api.updateProfile(
      fullName: fullName,
      phone: phone,
      photoUrl: photoUrl,
    );

    return model.toEntity();
  }

  @override
  Future<String> uploadProfileImage(String imagePath) {
    return _api.uploadProfileImage(imagePath);
  }

  @override
  Future<void> logout() async {
    // Global authentication state owns logout.
    //
    // AuthenticationProvider.logout() calls:
    //   POST /auth/logout
    //   StorageService.clearTokens()
    //
    // Therefore this method intentionally does not duplicate
    // the logout API request.
  }
}