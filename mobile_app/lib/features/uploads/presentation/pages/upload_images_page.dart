import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/upload_provider.dart';
import '../widgets/image_picker_card.dart';
import '../widgets/upload_progress_widget.dart';

class UploadImagesPage extends ConsumerStatefulWidget {
  const UploadImagesPage({super.key});

  @override
  ConsumerState<UploadImagesPage> createState() => _UploadImagesPageState();
}

class _UploadImagesPageState extends ConsumerState<UploadImagesPage> {
  List<File> _selectedImages = [];

  Future<void> _uploadImages() async {
    if (_selectedImages.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please select at least one image.')),
      );
      return;
    }

    await ref.read(uploadProvider.notifier).uploadImages(_selectedImages);

    if (!mounted) return;

    final state = ref.read(uploadProvider);

    if (state.error == null && state.uploadedImages.isNotEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Images uploaded successfully.')),
      );

      Navigator.pop(context, state.uploadedImages);
    }
  }

  @override
  Widget build(BuildContext context) {
    final uploadState = ref.watch(uploadProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Upload Property Images')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            ImagePickerCard(
              maxImages: 10,
              onImagesChanged: (images) {
                _selectedImages = images;
              },
            ),

            const SizedBox(height: 24),

            UploadProgressWidget(
              isUploading: uploadState.isUploading,
              progress: uploadState.progress,
              error: uploadState.error,
              onRetry: _uploadImages,
            ),

            const SizedBox(height: 30),

            SizedBox(
              width: double.infinity,
              height: 55,
              child: ElevatedButton.icon(
                onPressed: uploadState.isUploading ? null : _uploadImages,
                icon: uploadState.isUploading
                    ? const SizedBox(
                        width: 20,
                        height: 20,
                        child: CircularProgressIndicator(
                          strokeWidth: 2,
                          color: Colors.white,
                        ),
                      )
                    : const Icon(Icons.cloud_upload),
                label: Text(
                  uploadState.isUploading ? 'Uploading...' : 'Upload Images',
                ),
              ),
            ),

            const SizedBox(height: 30),

            if (uploadState.uploadedImages.isNotEmpty)
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'Uploaded Images',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),

                  const SizedBox(height: 16),

                  GridView.builder(
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    itemCount: uploadState.uploadedImages.length,
                    gridDelegate:
                        const SliverGridDelegateWithFixedCrossAxisCount(
                          crossAxisCount: 2,
                          crossAxisSpacing: 12,
                          mainAxisSpacing: 12,
                        ),
                    itemBuilder: (context, index) {
                      final image = uploadState.uploadedImages[index];

                      return ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.network(
                          image.imageUrl,
                          fit: BoxFit.cover,
                          errorBuilder: (context, error, stackTrace) {
                            return Container(
                              color: Colors.grey.shade300,
                              child: const Center(
                                child: Icon(Icons.broken_image, size: 40),
                              ),
                            );
                          },
                        ),
                      );
                    },
                  ),
                ],
              ),
          ],
        ),
      ),
    );
  }
}
