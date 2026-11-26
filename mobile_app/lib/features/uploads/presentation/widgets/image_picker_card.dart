import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:image_picker/image_picker.dart';

import '../../../../core/utils/image_utils.dart';

class ImagePickerCard extends StatefulWidget {
  final Function(List<XFile>) onImagesChanged;

  final int maxImages;
  final String title;
  final List<XFile> initialImages;

  const ImagePickerCard({
    super.key,
    required this.onImagesChanged,
    this.maxImages = 10,
    this.title = 'Property Images',
    this.initialImages = const [],
  });

  @override
  State<ImagePickerCard> createState() => _ImagePickerCardState();
}

class _ImagePickerCardState extends State<ImagePickerCard> {
  final ImagePicker _picker = ImagePicker();

  final List<XFile> _images = [];
  final Map<XFile, Future<Uint8List>> _imageBytes = {};

  @override
  void initState() {
    super.initState();
    _images.addAll(widget.initialImages);
  }

  @override
  void didUpdateWidget(covariant ImagePickerCard oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (!listEquals(oldWidget.initialImages, widget.initialImages)) {
      _images
        ..clear()
        ..addAll(widget.initialImages);
      _imageBytes.clear();
    }
  }

  bool _loading = false;

  // ==========================================
  // Gallery
  // ==========================================

  Future<void> _pickGallery() async {
    try {
      final files = await _picker.pickMultiImage(imageQuality: 90);

      if (!mounted || files.isEmpty) return;

      if (_images.length + files.length > widget.maxImages) {
        _showMessage('Maximum ${widget.maxImages} images allowed.');
        return;
      }

      setState(() {
        _loading = true;
      });

      for (final file in files) {
        if (!mounted) return;

        try {
          final image = await ImageUtils.prepareImage(file);
          if (!mounted) return;
          _images.add(image);
        } catch (e) {
          if (!mounted) return;
          _showMessage(e.toString());
        }
      }

      if (mounted) {
        widget.onImagesChanged(_images);
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
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

    try {
      final file = await _picker.pickImage(
        source: ImageSource.camera,
        imageQuality: 90,
      );

      if (!mounted || file == null) return;

      setState(() {
        _loading = true;
      });

      final image = await ImageUtils.prepareImage(file);
      if (!mounted) return;

      _images.add(image);
      widget.onImagesChanged(_images);
    } catch (e) {
      if (mounted) {
        _showMessage(e.toString());
      }
    } finally {
      if (mounted) {
        setState(() {
          _loading = false;
        });
      }
    }
  }

  // ==========================================
  // Delete Image
  // ==========================================

  void _remove(int index) {
    final removed = _images[index];
    setState(() {
      _images.removeAt(index);
      _imageBytes.remove(removed);
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
                child: FutureBuilder<Uint8List>(
                  future: _imageBytes.putIfAbsent(
                    _images[index],
                    () => _images[index].readAsBytes(),
                  ),
                  builder: (context, snapshot) {
                    if (snapshot.hasError) {
                      return const Center(
                        child: Icon(Icons.broken_image, color: Colors.grey),
                      );
                    }
                    if (!snapshot.hasData) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    return Image.memory(snapshot.data!, fit: BoxFit.cover);
                  },
                ),
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
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
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
