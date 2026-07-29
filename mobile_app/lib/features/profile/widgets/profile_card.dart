import 'package:flutter/material.dart';

import '../domain/entities/profile_entity.dart';

class ProfileCard extends StatelessWidget {
  const ProfileCard({super.key, required this.entity});

  final ProfileEntity entity;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 2,

      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),

      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),

      child: Padding(
        padding: const EdgeInsets.all(16),

        child: Row(
          children: [
            CircleAvatar(
              radius: 32,

              backgroundImage: entity.profileImage != null
                  ? NetworkImage(entity.profileImage!)
                  : null,

              child: entity.profileImage == null
                  ? Text(
                      entity.fullName.substring(0, 1).toUpperCase(),

                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    )
                  : null,
            ),

            const SizedBox(width: 16),

            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,

                children: [
                  Text(
                    entity.fullName,

                    style: const TextStyle(
                      fontSize: 18,

                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 6),

                  Text(entity.email),

                  const SizedBox(height: 4),

                  Text(entity.phone),

                  const SizedBox(height: 8),

                  Row(
                    children: [
                      Chip(label: Text(entity.role)),

                      if (entity.isVerified)
                        const Padding(
                          padding: EdgeInsets.only(left: 8),

                          child: Icon(
                            Icons.verified,

                            color: Colors.blue,

                            size: 20,
                          ),
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
