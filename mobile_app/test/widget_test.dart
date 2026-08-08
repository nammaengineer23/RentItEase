import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/app.dart';
import 'package:mobile_app/features/authentication/presentation/pages/authentication_page.dart';

void main()
{
  group('RentItEase Widget Tests', ()
{
    testWidgets('RentItEase app renders successfully',
(WidgetTester tester) async
{
      await tester.pumpWidget(const RentItEaseApp());

      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('Authentication page renders successfully',
(WidgetTester tester) async
{
      await tester.pumpWidget(
        const MaterialApp(
          home: AuthenticationPage(),
        ),
      );

      expect(find.byType(AuthenticationPage), findsOneWidget);
    });

  });
}