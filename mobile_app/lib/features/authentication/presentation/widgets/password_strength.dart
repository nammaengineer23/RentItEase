import 'package:flutter/material.dart';

class PasswordStrength extends StatelessWidget {
  final String password;

  const PasswordStrength({super.key, required this.password});

  @override
  Widget build(BuildContext context) {
    double strength = _calculateStrength(password);

    Color color;
    String text;

    if (strength < 0.3) {
      color = Colors.red;
      text = "Weak";
    } else if (strength < 0.7) {
      color = Colors.orange;
      text = "Medium";
    } else {
      color = Colors.green;
      text = "Strong";
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        LinearProgressIndicator(
          value: strength,
          minHeight: 8,
          borderRadius: BorderRadius.circular(10),
          backgroundColor: Colors.grey.shade300,
          valueColor: AlwaysStoppedAnimation(color),
        ),

        const SizedBox(height: 8),

        Row(
          children: [
            Text(
              "Password Strength:",
              style: Theme.of(context).textTheme.bodyMedium,
            ),

            const SizedBox(width: 8),

            Text(
              text,
              style: TextStyle(color: color, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ],
    );
  }

  double _calculateStrength(String password) {
    if (password.isEmpty) return 0;

    double score = 0;

    if (password.length >= 8) score += 0.25;

    if (RegExp(r'[A-Z]').hasMatch(password)) {
      score += 0.25;
    }

    if (RegExp(r'[0-9]').hasMatch(password)) {
      score += 0.25;
    }

    if (RegExp(r'[!@#\$%^&*(),.?":{}|<>]').hasMatch(password)) {
      score += 0.25;
    }

    return score.clamp(0, 1);
  }
}
