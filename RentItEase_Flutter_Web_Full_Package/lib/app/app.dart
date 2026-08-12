import 'package:flutter/material.dart';

import 'app_router.dart';
import '../core/theme/app_theme.dart';

class RentItEaseApp extends StatelessWidget {
  const RentItEaseApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'RentItEase',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      routerConfig: appRouter,
    );
  }
}
