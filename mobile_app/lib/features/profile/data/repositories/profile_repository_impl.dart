import '../../domain/entities/profile_entity.dart';
import '../../domain/repositories/profile_repository.dart';
import '../models/profile_model.dart';

class ProfileRepositoryImpl implements ProfileRepository {
  @override
  Future<ProfileEntity> getProfile() async {
    // TODO:
    // Replace with Dio API call:
    // GET /api/v1/auth/me

    await Future.delayed(const Duration(milliseconds: 500));

    return ProfileModel(
      id: 'user_001',

      fullName: 'RentItEase User',

      email: 'user@RentItEase.com',

      phone: '+91 9876543210',

      profileImage: null,

      role: 'USER',

      isVerified: true,

      isActive: true,

      createdAt: DateTime.now(),
    );
  }

  @override
  Future<ProfileEntity> updateProfile({
    required String fullName,

    required String phone,
  }) async {
    // TODO:
    // Replace with API:
    // PATCH /api/v1/users/profile

    await Future.delayed(const Duration(milliseconds: 500));

    return ProfileModel(
      id: 'user_001',

      fullName: fullName,

      email: 'user@RentItEase.com',

      phone: phone,

      profileImage: null,

      role: 'USER',

      isVerified: true,

      isActive: true,

      createdAt: DateTime.now(),
    );
  }

  @override
  Future<String> uploadProfileImage(String imagePath) async {
    // TODO:
    // Upload to Firebase Storage
    // Return download URL

    await Future.delayed(const Duration(seconds: 1));

    return imagePath;
  }

  @override
  Future<void> logout() async {
    // TODO:
    // Clear:
    // JWT Access Token
    // Refresh Token
    // SharedPreferences data

    await Future.delayed(const Duration(milliseconds: 300));
  }
}
