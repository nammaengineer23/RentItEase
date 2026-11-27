import 'package:image_picker/image_picker.dart';

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
  });

  // ============================================================
  // PROFILE IMAGE
  // ============================================================

  Future<String> uploadProfileImage(XFile image);

  // ============================================================
  // LOGOUT
  // ============================================================

  Future<void> logout();
}
