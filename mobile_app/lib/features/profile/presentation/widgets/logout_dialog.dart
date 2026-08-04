import 'package:flutter/material.dart';

class LogoutDialog extends StatelessWidget
{
const LogoutDialog({super.key, required this.onConfirm});

  final VoidCallback onConfirm;

static Future<void> show(
    BuildContext context, {
    required VoidCallback onConfirm,
  }) async
{
    await showDialog(
      context: context,

builder: (_)
{
        return LogoutDialog(onConfirm: onConfirm);
      },
    );
  }

  @override
  Widget build(BuildContext context) 
{
    return AlertDialog(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),

title: const Row(
        children: [
          Icon(Icons.logout, color: Colors.red),

SizedBox(width: 10),

Text('Logout'),
        ],
      ),

content: const Text('Are you sure you want to logout from RentItEase?'),

actions: [
        TextButton(
          onPressed: ()
{
            Navigator.pop(context);
          },

child: const Text('Cancel'),
        ),

ElevatedButton(
          style: ElevatedButton.styleFrom(backgroundColor: Colors.red),

onPressed: ()
{
            Navigator.pop(context);

            onConfirm();
          },

child: const Text('Logout', style: TextStyle(color: Colors.white)),
        ),
      ],
    );
  }
}
