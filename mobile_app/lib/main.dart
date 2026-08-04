import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'core/router/app_router.dart';

void main()
{
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const ProviderScope(child: RentItEaseApp()));
}

class RentItEaseApp extends StatelessWidget
{
const RentItEaseApp({super.key});

  @override
  Widget build(BuildContext context) 
{
    return MaterialApp.router(
      debugShowCheckedModeBanner: false,

title: 'RentItEase',

theme: ThemeData(
        useMaterial3: true,

colorSchemeSeed: Colors.blue,

scaffoldBackgroundColor: Colors.white,

appBarTheme: const AppBarTheme(centerTitle: true),

inputDecorationTheme: InputDecorationTheme(
          border: OutlineInputBorder(borderRadius: BorderRadius.circular(14)),
focusedBorder: OutlineInputBorder(
            borderRadius: BorderRadius.circular(14),
          ),
        ),

elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            minimumSize: const Size(double.infinity, 56),
shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(14),
            ),
          ),
        ),
      ),

routerConfig: AppRouter.router,
    );
  }
}
