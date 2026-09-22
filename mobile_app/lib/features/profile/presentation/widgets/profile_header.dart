import 'package:flutter/material.dart';

import '../../domain/entities/profile_entity.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({super.key, required this.profile, this.onEdit});

  final ProfileEntity profile;

  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Container(
      width: double.infinity,

      padding: const EdgeInsets.all(20),

      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: Theme.of(context).brightness == Brightness.dark
              ? const [Color(0xFF18231E), Color(0xFF121C18)]
              : const [Color(0xFFEAF3FF), Color(0xFFF7F4FF), Color(0xFFFFF6E8)],
          stops: const [0, 0.55, 1],
        ),
        border: Border(
          bottom: BorderSide(
            color: colors.outlineVariant.withValues(alpha: 0.55),
          ),
        ),
        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),

          bottomRight: Radius.circular(30),
        ),
      ),

      child: Column(
        children: [
          CircleAvatar(
            radius: 50,

            backgroundColor: colors.surface,
            foregroundColor: colors.primary,

            backgroundImage: profile.profileImage != null
                ? NetworkImage(profile.profileImage!)
                : null,

            child: profile.profileImage == null
                ? Text(
                    profile.fullName.substring(0, 1).toUpperCase(),

                    style: TextStyle(
                      fontSize: 38,

                      fontWeight: FontWeight.bold,
                      color: colors.primary,
                    ),
                  )
                : null,
          ),

          const SizedBox(height: 16),

          Text(
            profile.fullName,

            style: TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
              color: colors.onSurface,
            ),
          ),

          const SizedBox(height: 6),

          Text(
            profile.email,
            style: TextStyle(color: colors.onSurface),
          ),

          const SizedBox(height: 12),

          Row(
            mainAxisAlignment: MainAxisAlignment.center,

            children: [
              Chip(
                avatar: const Icon(Icons.person, size: 18),

                label: Text(profile.role),
              ),

              if (profile.isVerified)
                const Padding(
                  padding: EdgeInsets.only(left: 8),

                  child: Chip(
                    avatar: Icon(Icons.verified, color: Colors.blue, size: 18),

                    label: Text('Verified'),
                  ),
                ),
            ],
          ),

          const SizedBox(height: 16),

          OutlinedButton.icon(
            onPressed: onEdit,

            style: OutlinedButton.styleFrom(
              foregroundColor: colors.onPrimaryContainer,
              side: BorderSide(color: colors.onSurface),
            ),

            icon: const Icon(Icons.edit),

            label: const Text('Edit Profile'),
          ),
        ],
      ),
    );
  }
}
