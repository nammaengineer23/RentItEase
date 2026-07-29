import 'package:flutter/material.dart';

class AnimatedLogo extends StatelessWidget {
  final Animation<double> animation;

  const AnimatedLogo({super.key, required this.animation});

  @override
  Widget build(BuildContext context) {
    return ScaleTransition(
      scale: animation,
      child: FadeTransition(
        opacity: animation,
        child: Hero(
          tag: 'app_logo',
          child: Container(
            width: 160,
            height: 160,
            decoration: BoxDecoration(
              borderRadius: BorderRadius.circular(32),
              boxShadow: [
                BoxShadow(
                  color: Colors.blue.withValues(alpha: 0.15),
                  blurRadius: 30,
                  spreadRadius: 6,
                  offset: const Offset(0, 10),
                ),
              ],
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(32),
              child: Image.asset('assets/images/logo.png', fit: BoxFit.cover),
            ),
          ),
        ),
      ),
    );
  }
}
