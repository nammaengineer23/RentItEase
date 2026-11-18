import 'package:dio/dio.dart';
import 'package:http_parser/http_parser.dart';
import 'package:image_picker/image_picker.dart';
import 'package:mime/mime.dart';

import '../models/uploaded_image_model.dart';

class UploadApi {
  final Dio dio;

  UploadApi(this.dio);

  Future<UploadedImageModel> uploadImage(XFile image) async {
    final bytes = await image.readAsBytes();
    final mimeType = lookupMimeType(
      image.name.isEmpty ? image.path : image.name,
      headerBytes: bytes.take(32).toList(),
    );
    final extension = switch (mimeType) {
      'image/jpeg' => 'jpg',
      'image/png' => 'png',
      'image/webp' => 'webp',
      _ => throw const FormatException(
          'Only genuine JPG, PNG and WEBP images can be uploaded.',
        ),
    };

    final formData = FormData.fromMap({
      'file': MultipartFile.fromBytes(
        bytes,
        filename: 'upload-image.$extension',
        contentType: MediaType.parse(mimeType!),
      ),
    });

    final response = await dio.post(
      '/uploads/image',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );

    return UploadedImageModel.fromJson(response.data);
  }

  Future<List<UploadedImageModel>> uploadImages(List<XFile> images) async {
    final uploaded = <UploadedImageModel>[];
    for (final image in images) {
      uploaded.add(await uploadImage(image));
    }
    return uploaded;
  }

  Future<void> deleteImage(String imageId) async {
    await dio.delete('/uploads/image/$imageId');
  }
}
