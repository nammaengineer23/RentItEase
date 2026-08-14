import '../entities/profile_entity.dart';

abstract class ProfileRepository {
  // ============================================================
  // CURRENT PROFILE
  // ============================================================

  Future<ProfileEntity> getProfile();

  // ============================================================
  // UPDATE PROFILE
  // ============================================================

  Future<ProfileEntity> updateProfile({
    required String fullName,
    required String phone,
    String? photoUrl,
  });

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  Future<String> uploadProfileImage(String imagePath);

  // ============================================================
  // LOGOUT
  // ============================================================

  Future<void> logout();
}