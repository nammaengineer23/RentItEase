class UploadedImageModel {
  final String id;
  final String imageUrl;
  final String fileName;
  final String contentType;
  final int size;
  final DateTime uploadedAt;

  const UploadedImageModel({
    required this.id,
    required this.imageUrl,
    required this.fileName,
    required this.contentType,
    required this.size,
    required this.uploadedAt,
  });

  factory UploadedImageModel.fromJson(
    Map<String, dynamic> json,
  ) {
    return UploadedImageModel(
      id: json['id'] ?? '',
      imageUrl: json['imageUrl'] ??
          json['url'] ??
          '',
      fileName: json['fileName'] ?? '',
      contentType:
          json['contentType'] ?? '',
      size: json['size'] ?? 0,
      uploadedAt: DateTime.tryParse(
            json['uploadedAt'] ??
                json['createdAt'] ??
                '',
          ) ??
          DateTime.now(),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'imageUrl': imageUrl,
      'fileName': fileName,
      'contentType': contentType,
      'size': size,
      'uploadedAt':
          uploadedAt.toIso8601String(),
    };
  }

  UploadedImageModel copyWith({
    String? id,
    String? imageUrl,
    String? fileName,
    String? contentType,
    int? size,
    DateTime? uploadedAt,
  }) {
    return UploadedImageModel(
      id: id ?? this.id,
      imageUrl:
          imageUrl ?? this.imageUrl,
      fileName:
          fileName ?? this.fileName,
      contentType:
          contentType ??
              this.contentType,
      size: size ?? this.size,
      uploadedAt:
          uploadedAt ??
              this.uploadedAt,
    );
  }
}