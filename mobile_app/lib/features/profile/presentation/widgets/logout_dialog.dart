import 'package:flutter/material.dart';

class LogoutDialog extends StatelessWidget {
  final VoidCallback onLogout;

  const LogoutDialog({
    super.key,
    required this.onLogout,
  });

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(20),
      ),

      title: Row(
        children: const [
          Icon(
            Icons.logout,
            color: Colors.red,
          ),
          SizedBox(width: 10),
          Text("Logout"),
        ],
      ),

      content: const Text(
        "Are you sure you want to logout from your account?",
      ),

      actions: [
        TextButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text(
            "Cancel",
          ),
        ),

        FilledButton(
          style: FilledButton.styleFrom(
            backgroundColor: Colors.red,
          ),
          onPressed: () {
            Navigator.pop(context);
            onLogout();
          },
          child: const Text(
            "Logout",
          ),
        ),
      ],
    );
  }
}