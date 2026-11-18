import 'package:image_picker/image_picker.dart';

import '../models/uploaded_image_model.dart';
import 'upload_api.dart';

class UploadRepository {
  final UploadApi api;

  UploadRepository(this.api);

  // ==========================================
  // Upload Single Image
  // ==========================================

  Future<UploadedImageModel> uploadImage(XFile image) async {
    return await api.uploadImage(image);
  }

  // ==========================================
  // Upload Multiple Images
  // ==========================================

  Future<List<UploadedImageModel>> uploadImages(List<XFile> images) async {
    return await api.uploadImages(images);
  }

  // ==========================================
  // Delete Uploaded Image
  // ==========================================

  Future<void> deleteImage(String imageId) async {
    await api.deleteImage(imageId);
  }
}
