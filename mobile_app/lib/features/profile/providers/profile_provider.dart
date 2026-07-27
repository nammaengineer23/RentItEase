import 'package:flutter_riverpod/flutter_riverpod.dart';

class UserProfile {
  final String id;
  final String fullName;
  final String email;
  final String phone;
  final String? photoUrl;
  final bool isOwner;

  const UserProfile({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    this.photoUrl,
    this.isOwner = false,
  });

  UserProfile copyWith({
    String? id,
    String? fullName,
    String? email,
    String? phone,
    String? photoUrl,
    bool? isOwner,
  }) {
    return UserProfile(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      photoUrl: photoUrl ?? this.photoUrl,
      isOwner: isOwner ?? this.isOwner,
    );
  }
}

class ProfileNotifier extends StateNotifier<UserProfile> {
  ProfileNotifier()
      : super(
          const UserProfile(
            id: 'user-001',
            fullName: 'Shrikant Kumar',
            email: 'shrikant@example.com',
            phone: '+91 9876543210',
            photoUrl: null,
            isOwner: false,
          ),
        );

  void updateProfile({
    String? fullName,
    String? email,
    String? phone,
    String? photoUrl,
  }) {
    state = state.copyWith(
      fullName: fullName,
      email: email,
      phone: phone,
      photoUrl: photoUrl,
    );
  }

  void updatePhoto(String photoUrl) {
    state = state.copyWith(
      photoUrl: photoUrl,
    );
  }

  void switchRole(bool owner) {
    state = state.copyWith(
      isOwner: owner,
    );
  }

  void logout() {
    // TODO
    // Clear JWT
    // Clear SharedPreferences
    // Navigate to Login
  }
}

final profileProvider =
    StateNotifierProvider<ProfileNotifier, UserProfile>(
  (ref) => ProfileNotifier(),
);