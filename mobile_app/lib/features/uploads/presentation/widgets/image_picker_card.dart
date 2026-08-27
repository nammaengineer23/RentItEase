import 'dart:io';

import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/utils/image_utils.dart';

class ImagePickerCard extends StatefulWidget {
  final Function(List<File>) onImagesChanged;

  final int maxImages;
  final String title;

  const ImagePickerCard({
    super.key,
    required this.onImagesChanged,
    this.maxImages = 10,
    this.title = 'Property Images',
  });

  @override
  State<ImagePickerCard> createState() => _ImagePickerCardState();
}

class _ImagePickerCardState extends State<ImagePickerCard> {
  final ImagePicker _picker = ImagePicker();

  final List<File> _images = [];

  bool _loading = false;

  // ==========================================
  // Gallery
  // ==========================================

  Future<void> _pickGallery() async {
    try {
      final files = await _picker.pickMultiImage(imageQuality: 90);

      if (files.isEmpty) return;

      if (_images.length + files.length > widget.maxImages) {
        _showMessage('Maximum ${widget.maxImages} images allowed.');
        return;
      }

      setState(() {
        _loading = true;
      });

      for (final file in files) {
        try {
          final image = await ImageUtils.prepareImage(File(file.path));

          _images.add(image);
        } catch (e) {
          _showMessage(e.toString());
        }
      }

      widget.onImagesChanged(_images);
    } finally {
      setState(() {
        _loading = false;
      });
    }
  }

  // ==========================================
  // Camera
  // ==========================================

  Future<void> _pickCamera() async {
    if (_images.length >= widget.maxImages) {
      _showMessage('Maximum ${widget.maxImages} images allowed.');
      return;
    }

    final file = await _picker.pickImage(
      source: ImageSource.camera,
      imageQuality: 90,
    );

    if (file == null) return;

    setState(() {
      _loading = true;
    });

    try {
      final image = await ImageUtils.prepareImage(File(file.path));

      _images.add(image);

      widget.onImagesChanged(_images);
    } catch (e) {
      _showMessage(e.toString());
    }

    setState(() {
      _loading = false;
    });
  }

  // ==========================================
  // Delete Image
  // ==========================================

  void _remove(int index) {
    setState(() {
      _images.removeAt(index);
    });

    widget.onImagesChanged(_images);
  }

  // ==========================================
  // Snackbar
  // ==========================================

  void _showMessage(String message) {
    ScaffoldMessenger.of(
      context,
    ).showSnackBar(SnackBar(content: Text(message)));
  }

  // ==========================================
  // Image Grid
  // ==========================================

  Widget _buildGrid() {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: _images.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemBuilder: (_, index) {
        return Stack(
          children: [
            Positioned.fill(
              child: ClipRRect(
                borderRadius: BorderRadius.circular(12),
                child: Image.file(_images[index], fit: BoxFit.cover),
              ),
            ),
            Positioned(
              top: 6,
              right: 6,
              child: InkWell(
                onTap: () => _remove(index),
                child: Container(
                  decoration: const BoxDecoration(
                    color: Colors.red,
                    shape: BoxShape.circle,
                  ),
                  padding: const EdgeInsets.all(4),
                  child: const Icon(Icons.close, color: Colors.white, size: 18),
                ),
              ),
            ),
          ],
        );
      },
    );
  }

  // ==========================================
  // Buttons
  // ==========================================

  Widget _buildButtons() {
    return Row(
      children: [
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _loading ? null : _pickGallery,
            icon: const Icon(Icons.photo_library),
            label: const Text("Gallery"),
          ),
        ),
        const SizedBox(width: 16),
        Expanded(
          child: ElevatedButton.icon(
            onPressed: _loading ? null : _pickCamera,
            icon: const Icon(Icons.camera_alt),
            label: const Text("Camera"),
          ),
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 1,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(18)),
      child: Padding(
        padding: const EdgeInsets.all(18),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              widget.title,
              style: const TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 6),

            Text(
              "${_images.length}/${widget.maxImages} selected",
              style: TextStyle(color: Colors.grey[600]),
            ),

            const SizedBox(height: 18),

            _buildButtons(),

            const SizedBox(height: 20),

            if (_loading)
              const Center(child: CircularProgressIndicator())
            else if (_images.isEmpty)
              Container(
                height: 180,
                width: double.infinity,
                decoration: BoxDecoration(
                  border: Border.all(color: Colors.grey),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.image, size: 50, color: Colors.grey),
                      SizedBox(height: 12),
                      Text("No Images Selected"),
                    ],
                  ),
                ),
              )
            else
              _buildGrid(),
          ],
        ),
      ),
    );
  }
}
