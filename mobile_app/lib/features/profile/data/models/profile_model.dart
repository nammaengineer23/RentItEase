import '../../domain/entities/profile_entity.dart';

class ProfileModel extends ProfileEntity {
  const ProfileModel({
    required super.id,
    required super.fullName,
    required super.email,
    required super.phone,
    super.profileImage,
    required super.role,
    required super.isVerified,
    required super.isActive,
    required super.createdAt,
  });

  factory ProfileModel.fromJson(Map<String, dynamic> json) {
    return ProfileModel(
      id: json['id'] ?? '',

      fullName: json['fullName'] ?? json['name'] ?? '',

      email: json['email'] ?? '',

      phone: json['phone'] ?? '',

      profileImage: json['profileImage'] ?? json['photoUrl'],

      role: json['role'] ?? 'USER',

      isVerified: json['isVerified'] ?? false,

      isActive: json['isActive'] ?? true,

      createdAt: json['createdAt'] != null
          ? DateTime.parse(json['createdAt'])
          : DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      "id": id,

      "fullName": fullName,

      "email": email,

      "phone": phone,

      "profileImage": profileImage,

      "role": role,

      "isVerified": isVerified,

      "isActive": isActive,

      "createdAt": createdAt.toIso8601String(),
    };
  }

  factory ProfileModel.fromEntity(ProfileEntity entity) {
    return ProfileModel(
      id: entity.id,
      fullName: entity.fullName,
      email: entity.email,
      phone: entity.phone,
      profileImage: entity.profileImage,
      role: entity.role,
      isVerified: entity.isVerified,
      isActive: entity.isActive,
      createdAt: entity.createdAt,
    );
  }

  ProfileModel copyWith({
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
    return ProfileModel(
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
