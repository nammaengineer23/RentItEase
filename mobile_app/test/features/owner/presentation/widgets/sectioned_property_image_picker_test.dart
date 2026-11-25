import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/features/owner/data/api/property_image_api.dart';
import 'package:mobile_app/features/owner/presentation/widgets/sectioned_property_image_picker.dart';

PropertyImageRecord photo(String id, {bool? isPrimary}) {
  return PropertyImageRecord(
    id: id,
    imageUrl: 'https://example.com/$id.jpg',
    section: 'EXTERIOR',
    isPrimary: isPrimary ?? id == 'photo-1',
  );
}

Widget picker({
  required Map<String, List<PropertyImageRecord>> images,
  Future<void> Function(PropertyImageRecord)? onDelete,
}) {
  return MaterialApp(
    home: Scaffold(
      body: SingleChildScrollView(
        child: SectionedPropertyImagePicker(
          key: const ValueKey('photo-picker'),
          initialImages: images,
          onImagesChanged: (_) {},
          onDeleteExisting: onDelete,
        ),
      ),
    ),
  );
}

void main() {
  group('SectionedPropertyImagePicker', () {
    testWidgets('shows saved photos and primary marker', (tester) async {
      await tester.pumpWidget(
        picker(
          images: {
            'EXTERIOR': [photo('photo-1')],
          },
        ),
      );
      await tester.pump();

      expect(find.text('1 photo selected'), findsOneWidget);
      expect(find.text('Exterior'), findsOneWidget);
      expect(find.text('Primary'), findsOneWidget);
    });

    testWidgets('removes saved photo after successful deletion', (
      tester,
    ) async {
      var deleteCalls = 0;

      await tester.pumpWidget(
        picker(
          images: {
            'EXTERIOR': [photo('photo-1')],
          },
          onDelete: (_) async {
            deleteCalls++;
          },
        ),
      );
      await tester.pump();

      await tester.tap(find.byIcon(Icons.delete_outline).first);
      await tester.pumpAndSettle();

      expect(deleteCalls, 1);
      expect(find.text('0 photos selected'), findsOneWidget);
      expect(find.text('Primary'), findsNothing);
    });

    testWidgets('shows backend-promoted primary after deleting old primary', (
      tester,
    ) async {
      var deleteCalls = 0;

      await tester.pumpWidget(
        picker(
          images: {
            'EXTERIOR': [photo('photo-1'), photo('photo-2', isPrimary: false)],
          },
          onDelete: (_) async {
            deleteCalls++;
          },
        ),
      );
      await tester.pump();

      expect(find.text('Primary'), findsOneWidget);
      expect(find.text('2 photos selected'), findsOneWidget);

      await tester.tap(find.byIcon(Icons.delete_outline).first);
      await tester.pumpAndSettle();

      expect(deleteCalls, 1);
      expect(find.text('1 photo selected'), findsOneWidget);

      // Simulate the parent refreshing from the backend, which promotes
      // photo-2 after photo-1 (the old primary) is deleted.
      await tester.pumpWidget(
        picker(
          images: {
            'EXTERIOR': [photo('photo-2', isPrimary: true)],
          },
        ),
      );
      await tester.pump();

      expect(find.text('1 photo selected'), findsOneWidget);
      expect(find.text('Primary'), findsOneWidget);
    });

    testWidgets(
      'does not invent a primary when refresh after deletion is unavailable',
      (tester) async {
        await tester.pumpWidget(
          picker(
            images: {
              'EXTERIOR': [
                photo('photo-1'),
                photo('photo-2', isPrimary: false),
              ],
            },
            onDelete: (_) async {},
          ),
        );
        await tester.pump();

        expect(find.text('Primary'), findsOneWidget);
        expect(find.text('2 photos selected'), findsOneWidget);

        await tester.tap(find.byIcon(Icons.delete_outline).first);
        await tester.pumpAndSettle();

        expect(find.text('1 photo selected'), findsOneWidget);
        expect(find.text('Primary'), findsNothing);
      },
    );

    testWidgets('retains saved photo when deletion fails', (tester) async {
      await tester.pumpWidget(
        picker(
          images: {
            'EXTERIOR': [photo('photo-1')],
          },
          onDelete: (_) async {
            throw StateError('Delete failed');
          },
        ),
      );
      await tester.pump();

      await tester.tap(find.byIcon(Icons.delete_outline).first);
      await tester.pumpAndSettle();

      expect(find.text('1 photo selected'), findsOneWidget);
      expect(find.text('Primary'), findsOneWidget);
    });

    testWidgets('synchronizes when parent supplies refreshed images', (
      tester,
    ) async {
      await tester.pumpWidget(
        picker(
          images: {
            'EXTERIOR': [photo('photo-1')],
          },
        ),
      );
      await tester.pump();

      expect(find.text('1 photo selected'), findsOneWidget);

      await tester.pumpWidget(
        picker(
          images: {
            'EXTERIOR': [photo('photo-1'), photo('photo-2')],
          },
        ),
      );
      await tester.pump();

      expect(find.text('2 photos selected'), findsOneWidget);
      expect(
        find.text('This section already has the maximum of 2 photos.'),
        findsOneWidget,
      );
    });
  });
}
