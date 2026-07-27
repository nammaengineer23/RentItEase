import 'package:flutter/material.dart';

import 'login_page.dart';
import 'register_page.dart';

class AuthenticationPage extends StatefulWidget {
  const AuthenticationPage({
    super.key,
  });

  @override
  State<AuthenticationPage> createState() =>
      _AuthenticationPageState();
}

class _AuthenticationPageState
    extends State<AuthenticationPage> {
  bool _showLogin = true;

  void _openLogin() {
    setState(() {
      _showLogin = true;
    });
  }

  void _openRegister() {
    setState(() {
      _showLogin = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return AnimatedSwitcher(
      duration: const Duration(
        milliseconds: 300,
      ),
      transitionBuilder: (
        child,
        animation,
      ) {
        return FadeTransition(
          opacity: animation,
          child: child,
        );
      },
      child: _showLogin
          ? LoginPage(
              key: const ValueKey('login'),
              onRegister: _openRegister,
            )
          : RegisterPage(
              key: const ValueKey('register'),
              onLogin: _openLogin,
            ),
    );
  }
}