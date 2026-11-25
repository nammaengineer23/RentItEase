import 'dart:typed_data';

import 'package:dio/dio.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mobile_app/features/owner/data/api/property_image_api.dart';

class _TestAdapter implements HttpClientAdapter {
  int requestCount = 0;
  int? failOnRequest;
  final uploadedPrimaryFlags = <bool>[];

  @override
  Future<ResponseBody> fetch(
    RequestOptions options,
    Stream<Uint8List>? requestStream,
    Future<void>? cancelFuture,
  ) async {
    requestCount++;

    final requestData = options.data;
    if (requestData is FormData) {
      final primaryField = requestData.fields
          .where((field) => field.key == 'isPrimary')
          .firstOrNull;
      if (primaryField != null) {
        uploadedPrimaryFlags.add(primaryField.value == 'true');
      }
    }

    if (requestCount == failOnRequest) {
      throw DioException(
        requestOptions: options,
        message: 'Simulated upload failure',
      );
    }

    return ResponseBody.fromString(
      '{}',
      200,
      headers: {
        Headers.contentTypeHeader: [Headers.jsonContentType],
      },
    );
  }

  @override
  void close({bool force = false}) {}
}

XFile _testImage(String name) {
  return XFile.fromData(
    Uint8List.fromList([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]),
    name: name,
    mimeType: 'image/jpeg',
  );
}

void main() {
  group('isPropertyImageRefreshConsistent', () {
    PropertyImageRecord image(String id) => PropertyImageRecord(
      id: id,
      imageUrl: 'https://example.com/$id.jpg',
      section: 'EXTERIOR',
      isPrimary: false,
    );

    test('accepts a complete refresh containing all known images', () {
      expect(
        isPropertyImageRefreshConsistent(
          refreshedImages: [image('photo-1'), image('photo-2')],
          requiredImageIds: {'photo-1'},
          minimumImageCount: 2,
        ),
        isTrue,
      );
    });

    test('rejects a refresh missing a previously known image', () {
      expect(
        isPropertyImageRefreshConsistent(
          refreshedImages: [image('photo-2'), image('photo-3')],
          requiredImageIds: {'photo-1'},
          minimumImageCount: 2,
        ),
        isFalse,
      );
    });

    test('rejects a stale refresh containing a deleted image', () {
      expect(
        isPropertyImageRefreshConsistent(
          refreshedImages: [image('photo-1'), image('photo-2')],
          requiredImageIds: {'photo-2'},
          minimumImageCount: 1,
          excludedImageIds: {'photo-1'},
        ),
        isFalse,
      );
    });

    test('rejects a refresh below the expected image count', () {
      expect(
        isPropertyImageRefreshConsistent(
          refreshedImages: [image('photo-1')],
          requiredImageIds: {'photo-1'},
          minimumImageCount: 2,
        ),
        isFalse,
      );
    });
  });

  group('PropertyImageApi.uploadSectionImages', () {
    late Dio dio;
    late _TestAdapter adapter;
    late PropertyImageApi api;

    setUp(() {
      adapter = _TestAdapter();
      dio = Dio(BaseOptions(baseUrl: 'https://test.example.com'));
      dio.httpClientAdapter = adapter;
      api = PropertyImageApi(dio);
    });

    tearDown(() {
      dio.close(force: true);
    });

    test(
      'does not assign a new primary when retrying uploaded sections',
      () async {
        await api.uploadSectionImages(
          propertyId: 'property-1',
          imagesBySection: {
            'INTERIOR': [_testImage('interior.jpg')],
            'KITCHEN': [_testImage('kitchen.jpg')],
          },
          assignFirstAsPrimary: false,
        );

        expect(adapter.requestCount, 2);
        expect(adapter.uploadedPrimaryFlags, [false, false]);
      },
    );

    test(
      'assigns only the first image section as primary by default',
      () async {
        await api.uploadSectionImages(
          propertyId: 'property-1',
          imagesBySection: {
            'EXTERIOR': [_testImage('exterior.jpg')],
            'INTERIOR': [_testImage('interior.jpg')],
          },
        );

        expect(adapter.requestCount, 2);
        expect(adapter.uploadedPrimaryFlags, [true, false]);
      },
    );

    test('skips empty sections without consuming primary assignment', () async {
      await api.uploadSectionImages(
        propertyId: 'property-1',
        imagesBySection: {
          'EXTERIOR': [],
          'INTERIOR': [_testImage('interior.jpg')],
        },
      );

      expect(adapter.requestCount, 1);
      expect(adapter.uploadedPrimaryFlags, [true]);
    });

    test('reports each section after its upload succeeds', () async {
      final uploadedSections = <String>[];

      await api.uploadSectionImages(
        propertyId: 'property-1',
        imagesBySection: {
          'EXTERIOR': [_testImage('exterior.jpg')],
          'INTERIOR': [_testImage('interior.jpg')],
        },
        onSectionUploaded: uploadedSections.add,
      );

      expect(adapter.requestCount, 2);
      expect(uploadedSections, ['EXTERIOR', 'INTERIOR']);
    });

    test(
      'reports only successful sections when a later upload fails',
      () async {
        adapter.failOnRequest = 2;
        final uploadedSections = <String>[];

        await expectLater(
          api.uploadSectionImages(
            propertyId: 'property-1',
            imagesBySection: {
              'EXTERIOR': [_testImage('exterior.jpg')],
              'INTERIOR': [_testImage('interior.jpg')],
            },
            onSectionUploaded: uploadedSections.add,
          ),
          throwsA(isA<DioException>()),
        );

        expect(adapter.requestCount, 2);
        expect(uploadedSections, ['EXTERIOR']);

        // Retry only the section that failed.
        adapter.failOnRequest = null;

        await api.uploadSectionImages(
          propertyId: 'property-1',
          imagesBySection: {
            'INTERIOR': [_testImage('interior.jpg')],
          },
          onSectionUploaded: uploadedSections.add,
        );

        expect(adapter.requestCount, 3);
        expect(uploadedSections, ['EXTERIOR', 'INTERIOR']);
      },
    );
  });
}
