import 'dart:io';

import 'package:dio/dio.dart';

import '../models/uploaded_image_model.dart';

class UploadApi {
  final Dio dio;

  UploadApi(this.dio);

  // ==========================================
  // Upload Single Image
  // ==========================================

  Future<UploadedImageModel> uploadImage(File image) async {
    final fileName = image.path.split('/').last;

    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(image.path, filename: fileName),
    });

    final response = await dio.post(
      '/uploads/image',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    return UploadedImageModel.fromJson(response.data);
  }

  // ==========================================
  // Upload Multiple Images
  // ==========================================

  Future<List<UploadedImageModel>> uploadImages(List<File> images) async {
    final List<UploadedImageModel> uploaded = [];

    for (final image in images) {
      final result = await uploadImage(image);

      uploaded.add(result);
    }

    return uploaded;
  }

  // ==========================================
  // Delete Uploaded Image
  // ==========================================

  Future<void> deleteImage(String imageId) async {
    await dio.delete('/uploads/image/$imageId');
  }
}
