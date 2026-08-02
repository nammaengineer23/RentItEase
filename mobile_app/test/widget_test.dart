import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:mobile_app/app.dart';
import 'package:mobile_app/features/authentication/presentation/pages/authentication_page.dart';
import 'package:mobile_app/features/search/data/repositories/search_repository_impl.dart';

void main() {
  group('RentEase Widget Tests', () {
    testWidgets('RentEase app renders successfully',
        (WidgetTester tester) async {
      await tester.pumpWidget(const RentEaseApp());

      expect(find.byType(MaterialApp), findsOneWidget);
    });

    testWidgets('Authentication page renders successfully',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        const MaterialApp(
          home: AuthenticationPage(),
        ),
      );

      expect(find.byType(AuthenticationPage), findsOneWidget);
    });

    test('Search repository returns sample data', () async {
      final repository = SearchRepositoryImpl();

      final results = await repository.load();

      expect(results, isNotEmpty);
      expect(results.length, greaterThanOrEqualTo(1));
    });
  });
}