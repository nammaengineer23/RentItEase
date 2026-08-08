import '../domain/entities/profile_entity.dart';
import '../domain/repositories/profile_repository.dart';

import 'models/profile_model.dart';
import 'profile_api.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  ProfileRepositoryImpl(this._api);

  final ProfileApi _api;

  //=========================================
  // Get Profile
  //=========================================

  @override
  Future<ProfileEntity> getProfile() async {
    final ProfileModel model = await _api.getProfile();
    return model.toEntity();
  }

  //=========================================
  // Update Profile
  //=========================================

  @override
  Future<ProfileEntity> updateProfile({
    required String fullName,
    required String phone,
  }) async {
    final ProfileModel model = await _api.updateProfile(
      fullName: fullName,
      phone: phone,
    );

    return model.toEntity();
  }

  //=========================================
  // Upload Profile Image
  //=========================================

  @override
  Future<String> uploadProfileImage(String imagePath) {
    return _api.uploadProfileImage(imagePath);
  }

  //=========================================
  // Logout
  //=========================================

  @override
  Future<void> logout() async {
    // JWT removal will be handled in Auth module.
  }
}