import 'package:flutter/material.dart';

class ProfileMenuTile extends StatelessWidget {
  const ProfileMenuTile({
    super.key,

    required this.icon,

    required this.title,

    this.subtitle,

    this.onTap,

    this.trailing,

    this.color,
  });

  final IconData icon;

  final String title;

  final String? subtitle;

  final VoidCallback? onTap;

  final Widget? trailing;

  final Color? color;

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 0,

      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),

      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),

      child: ListTile(
        onTap: onTap,

        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),

        leading: Container(
          width: 42,

          height: 42,

          decoration: BoxDecoration(
            color: (color ?? Theme.of(context).colorScheme.primary).withValues(
              alpha: 0.12,
            ),

            borderRadius: BorderRadius.circular(12),
          ),

          child: Icon(
            icon,

            color: color ?? Theme.of(context).colorScheme.primary,
          ),
        ),

        title: Text(
          title,

          style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 16),
        ),

        subtitle: subtitle != null ? Text(subtitle!) : null,

        trailing: trailing ?? const Icon(Icons.arrow_forward_ios, size: 16),
      ),
    );
  }
}
