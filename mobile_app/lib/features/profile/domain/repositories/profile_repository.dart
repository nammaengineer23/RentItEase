import '../entities/profile_entity.dart';

abstract class ProfileRepository {
  // Get current logged-in user profile
  Future<ProfileEntity> getProfile();

  // Update user profile details
  Future<ProfileEntity> updateProfile({
    required String fullName,
    required String phone,
  });

  // Upload profile image
  Future<String> uploadProfileImage(String imagePath);

  // Logout user
  Future<void> logout();
}
