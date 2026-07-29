class ProfileEntity {
  final String id;

  final String fullName;

  final String email;

  final String phone;

  final String? profileImage;

  final String role;

  final bool isVerified;

  final bool isActive;

  final DateTime createdAt;

  const ProfileEntity({
    required this.id,
    required this.fullName,
    required this.email,
    required this.phone,
    this.profileImage,
    required this.role,
    required this.isVerified,
    required this.isActive,
    required this.createdAt,
  });

  ProfileEntity copyWith({
    String? id,
    String? fullName,
    String? email,
    String? phone,
    String? profileImage,
    String? role,
    bool? isVerified,
    bool? isActive,
    DateTime? createdAt,
  }) {
    return ProfileEntity(
      id: id ?? this.id,
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      profileImage: profileImage ?? this.profileImage,
      role: role ?? this.role,
      isVerified: isVerified ?? this.isVerified,
      isActive: isActive ?? this.isActive,
      createdAt: createdAt ?? this.createdAt,
    );
  }
}
