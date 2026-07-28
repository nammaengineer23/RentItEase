import 'package:flutter/material.dart';

class MapSearchBar extends StatelessWidget {
  final TextEditingController controller;
  final ValueChanged<String>? onChanged;
  final VoidCallback? onVoiceTap;
  final VoidCallback? onClear;

  const MapSearchBar({
    super.key,
    required this.controller,
    this.onChanged,
    this.onVoiceTap,
    this.onClear,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      elevation: 3,
      borderRadius: BorderRadius.circular(16),
      child: TextField(
        controller: controller,
        onChanged: onChanged,
        decoration: InputDecoration(
          hintText: 'Search location...',
          prefixIcon: const Icon(
            Icons.search,
          ),

          suffixIcon: Row(
            mainAxisSize: MainAxisSize.min,
            children: [

              if (controller.text.isNotEmpty)
                IconButton(
                  icon: const Icon(
                    Icons.close,
                  ),
                  onPressed: onClear,
                ),

              IconButton(
                icon: const Icon(
                  Icons.mic_none,
                ),
                onPressed: onVoiceTap,
              ),
            ],
          ),

          border: OutlineInputBorder(
            borderRadius:
                BorderRadius.circular(16),
            borderSide: BorderSide.none,
          ),

          filled: true,

          fillColor: Colors.white,

          contentPadding:
              const EdgeInsets.symmetric(
            horizontal: 16,
            vertical: 14,
          ),
        ),
      ),
    );
  }
}