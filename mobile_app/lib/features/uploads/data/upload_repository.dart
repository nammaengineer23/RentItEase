import 'dart:io';

import '../models/uploaded_image_model.dart';
import 'upload_api.dart';

class UploadRepository {
  final UploadApi api;

  UploadRepository(this.api);

  // ==========================================
  // Upload Single Image
  // ==========================================

  Future<UploadedImageModel> uploadImage(
    File image,
  ) async {
    return await api.uploadImage(
      image,
    );
  }

  // ==========================================
  // Upload Multiple Images
  // ==========================================

  Future<List<UploadedImageModel>>
      uploadImages(
    List<File> images,
  ) async {
    return await api.uploadImages(
      images,
    );
  }

  // ==========================================
  // Delete Uploaded Image
  // ==========================================

  Future<void> deleteImage(
    String imageId,
  ) async {
    await api.deleteImage(
      imageId,
    );
  }
}