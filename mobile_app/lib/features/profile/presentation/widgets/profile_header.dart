import 'package:flutter/material.dart';

import '../../domain/entities/profile_entity.dart';

class ProfileHeader extends StatelessWidget {
  const ProfileHeader({super.key, required this.profile, this.onEdit});

  final ProfileEntity profile;

  final VoidCallback? onEdit;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: double.infinity,

      padding: const EdgeInsets.all(20),

      decoration: BoxDecoration(
        color: Theme.of(context).colorScheme.primaryContainer,

        borderRadius: const BorderRadius.only(
          bottomLeft: Radius.circular(30),

          bottomRight: Radius.circular(30),
        ),
      ),

      child: Column(
        children: [
          CircleAvatar(
            radius: 50,

            backgroundColor: Colors.white,

            backgroundImage: profile.profileImage != null
                ? NetworkImage(profile.profileImage!)
                : null,

            child: profile.profileImage == null
                ? Text(
                    profile.fullName.substring(0, 1).toUpperCase(),

                    style: const TextStyle(
                      fontSize: 38,

                      fontWeight: FontWeight.bold,
                    ),
                  )
                : null,
          ),

          const SizedBox(height: 16),

          Text(
            profile.fullName,

            style: const TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 6),

          Text(profile.email, style: TextStyle(color: Colors.grey.shade700)),

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

            icon: const Icon(Icons.edit),

            label: const Text('Edit Profile'),
          ),
        ],
      ),
    );
  }
}
