import 'dart:io';

import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/upload_api.dart';
import '../data/upload_repository.dart';
import '../models/uploaded_image_model.dart';

// ======================================================
// NOTE:
// Remove this provider if you already have a global
// dioProvider in your project.
// ======================================================

final dioProvider = Provider<Dio>((ref) {
  return Dio(
    BaseOptions(
      baseUrl: 'http://localhost:3000/api/v1',
      headers: {
        'Content-Type': 'application/json',
      },
    ),
  );
});

// ======================================================
// Repository Provider
// ======================================================

final uploadRepositoryProvider =
    Provider<UploadRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return UploadRepository(
    UploadApi(dio),
  );
});

// ======================================================
// Upload State
// ======================================================

class UploadState {
  final bool isUploading;

  final double progress;

  final List<UploadedImageModel>
      uploadedImages;

  final String? error;

  const UploadState({
    this.isUploading = false,
    this.progress = 0,
    this.uploadedImages = const [],
    this.error,
  });

  UploadState copyWith({
    bool? isUploading,
    double? progress,
    List<UploadedImageModel>? uploadedImages,
    String? error,
  }) {
    return UploadState(
      isUploading:
          isUploading ?? this.isUploading,
      progress: progress ?? this.progress,
      uploadedImages:
          uploadedImages ??
              this.uploadedImages,
      error: error,
    );
  }
}

// ======================================================
// Upload Notifier
// ======================================================

class UploadNotifier
    extends StateNotifier<UploadState> {
  final UploadRepository repository;

  UploadNotifier(
    this.repository,
  ) : super(const UploadState());

  // ===========================================
  // Upload Single Image
  // ===========================================

  Future<void> uploadImage(
    File image,
  ) async {
    state = state.copyWith(
      isUploading: true,
      progress: 0,
      error: null,
    );

    try {
      final uploaded =
          await repository.uploadImage(
        image,
      );

      state = state.copyWith(
        isUploading: false,
        progress: 1,
        uploadedImages: [
          ...state.uploadedImages,
          uploaded,
        ],
      );
    } catch (e) {
      state = state.copyWith(
        isUploading: false,
        error: e.toString(),
      );
    }
  }

  // ===========================================
  // Upload Multiple Images
  // ===========================================

  Future<void> uploadImages(
    List<File> images,
  ) async {
    state = state.copyWith(
      isUploading: true,
      progress: 0,
      error: null,
    );

    try {
      final List<UploadedImageModel>
          uploaded = [];

      for (int i = 0;
          i < images.length;
          i++) {
        final image =
            await repository.uploadImage(
          images[i],
        );

        uploaded.add(image);

        state = state.copyWith(
          progress:
              (i + 1) / images.length,
        );
      }

      state = state.copyWith(
        isUploading: false,
        uploadedImages: [
          ...state.uploadedImages,
          ...uploaded,
        ],
      );
    } catch (e) {
      state = state.copyWith(
        isUploading: false,
        error: e.toString(),
      );
    }
  }

  // ===========================================
  // Remove Uploaded Image
  // ===========================================

  Future<void> deleteImage(
    UploadedImageModel image,
  ) async {
    await repository.deleteImage(
      image.id,
    );

    state = state.copyWith(
      uploadedImages:
          state.uploadedImages
              .where(
                (e) => e.id != image.id,
              )
              .toList(),
    );
  }

  // ===========================================
  // Clear Upload List
  // ===========================================

  void clearUploads() {
    state = state.copyWith(
      uploadedImages: [],
      progress: 0,
      error: null,
    );
  }
}

// ======================================================
// Provider
// ======================================================

final uploadProvider =
    StateNotifierProvider<
        UploadNotifier,
        UploadState>((ref) {
  final repository =
      ref.watch(uploadRepositoryProvider);

  return UploadNotifier(repository);
});