import 'dart:io';

import 'package:flutter/material.dart';

import '../../data/api/property_image_api.dart';
import '../../../uploads/presentation/widgets/image_picker_card.dart';

class PropertyPhotoSection {
  const PropertyPhotoSection({
    required this.value,
    required this.label,
    required this.icon,
  });

  final String value;
  final String label;
  final IconData icon;
}

const propertyPhotoSections = <PropertyPhotoSection>[
  PropertyPhotoSection(value: 'EXTERIOR', label: 'Exterior', icon: Icons.home_outlined),
  PropertyPhotoSection(value: 'LIVING_ROOM', label: 'Living Room', icon: Icons.weekend_outlined),
  PropertyPhotoSection(value: 'HALL', label: 'Hall', icon: Icons.meeting_room_outlined),
  PropertyPhotoSection(value: 'KITCHEN', label: 'Kitchen', icon: Icons.kitchen_outlined),
  PropertyPhotoSection(value: 'BEDROOM', label: 'Bedroom', icon: Icons.bed_outlined),
  PropertyPhotoSection(value: 'BATHROOM', label: 'Bathroom', icon: Icons.bathtub_outlined),
  PropertyPhotoSection(value: 'BALCONY', label: 'Balcony', icon: Icons.balcony_outlined),
  PropertyPhotoSection(value: 'DINING', label: 'Dining', icon: Icons.dining_outlined),
  PropertyPhotoSection(value: 'PARKING', label: 'Parking', icon: Icons.local_parking_outlined),
  PropertyPhotoSection(value: 'OTHER', label: 'Other', icon: Icons.photo_outlined),
];

class SectionedPropertyImagePicker extends StatefulWidget {
  const SectionedPropertyImagePicker({
    super.key,
    required this.onImagesChanged,
    this.initialImages = const {},
    this.onDeleteExisting,
  });

  final ValueChanged<Map<String, List<File>>> onImagesChanged;
  final Map<String, List<PropertyImageRecord>> initialImages;
  final Future<void> Function(PropertyImageRecord image)? onDeleteExisting;

  @override
  State<SectionedPropertyImagePicker> createState() =>
      _SectionedPropertyImagePickerState();
}

class _SectionedPropertyImagePickerState
    extends State<SectionedPropertyImagePicker> {
  final Map<String, List<File>> _newImagesBySection = {};
  late final Map<String, List<PropertyImageRecord>> _existingBySection;
  final Set<String> _deletingImageIds = {};

  @override
  void initState() {
    super.initState();
    _existingBySection = widget.initialImages.map(
      (section, images) => MapEntry(
        section,
        List<PropertyImageRecord>.from(images),
      ),
    );
  }

  void _updateSection(String section, List<File> images) {
    setState(() {
      if (images.isEmpty) {
        _newImagesBySection.remove(section);
      } else {
        _newImagesBySection[section] = List<File>.from(images);
      }
    });

    widget.onImagesChanged(
      _newImagesBySection.map(
        (section, sectionImages) =>
            MapEntry(section, List<File>.from(sectionImages)),
      ),
    );
  }

  Future<void> _deleteExisting(PropertyImageRecord image) async {
    final delete = widget.onDeleteExisting;
    if (delete == null || _deletingImageIds.contains(image.id)) return;

    setState(() => _deletingImageIds.add(image.id));
    try {
      await delete(image);
      if (!mounted) return;
      setState(() {
        _existingBySection[image.section]?.removeWhere(
          (candidate) => candidate.id == image.id,
        );
      });
    } catch (_) {
      // The parent callback presents the API error and keeps the image.
    } finally {
      if (mounted) {
        setState(() => _deletingImageIds.remove(image.id));
      }
    }
  }

  int get _totalImages {
    final existing = _existingBySection.values.fold<int>(
      0,
      (total, images) => total + images.length,
    );
    final added = _newImagesBySection.values.fold<int>(
      0,
      (total, images) => total + images.length,
    );
    return existing + added;
  }

  Widget _existingGrid(List<PropertyImageRecord> images) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      itemCount: images.length,
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 8,
        mainAxisSpacing: 8,
      ),
      itemBuilder: (context, index) {
        final image = images[index];
        final deleting = _deletingImageIds.contains(image.id);

        return Stack(
          fit: StackFit.expand,
          children: [
            ClipRRect(
              borderRadius: BorderRadius.circular(12),
              child: Image.network(
                image.imageUrl,
                fit: BoxFit.cover,
                errorBuilder: (_, _, _) =>
                    const Center(child: Icon(Icons.broken_image_outlined)),
              ),
            ),
            if (image.isPrimary)
              const Positioned(
                left: 6,
                bottom: 6,
                child: Chip(label: Text('Primary')),
              ),
            Positioned(
              top: 4,
              right: 4,
              child: IconButton.filled(
                onPressed: deleting ? null : () => _deleteExisting(image),
                icon: deleting
                    ? const SizedBox.square(
                        dimension: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : const Icon(Icons.delete_outline),
              ),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          '$_totalImages photo${_totalImages == 1 ? '' : 's'} selected',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 8),
        ...propertyPhotoSections.map((section) {
          final existing = _existingBySection[section.value] ?? const [];
          final added = _newImagesBySection[section.value] ?? const [];
          final remaining = existing.length >= 2 ? 0 : 2 - existing.length;

          return Card(
            clipBehavior: Clip.antiAlias,
            child: ExpansionTile(
              maintainState: true,
              initiallyExpanded: section.value == 'EXTERIOR',
              leading: Icon(section.icon),
              title: Text(section.label),
              subtitle: Text('${existing.length + added.length}/2 selected'),
              childrenPadding: const EdgeInsets.fromLTRB(8, 0, 8, 8),
              children: [
                if (existing.isNotEmpty) ...[
                  _existingGrid(existing),
                  const SizedBox(height: 8),
                ],
                if (remaining > 0)
                  ImagePickerCard(
                    title: '${section.label} Photos',
                    maxImages: remaining,
                    onImagesChanged: (images) =>
                        _updateSection(section.value, images),
                  )
                else
                  const Padding(
                    padding: EdgeInsets.all(12),
                    child: Text(
                      'This section already has the maximum of 2 photos.',
                    ),
                  ),
              ],
            ),
          );
        }),
      ],
    );
  }
}
