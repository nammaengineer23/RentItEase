import 'package:flutter/material.dart';

import '../../domain/entities/property_entity.dart';

import 'favorite_button.dart';
import 'featured_badge.dart';

class PropertyImageSlider extends StatefulWidget {
  const PropertyImageSlider({super.key, required this.property});

  final PropertyEntity property;

  @override
  State<PropertyImageSlider> createState() => _PropertyImageSliderState();
}

class _PropertyImageSliderState extends State<PropertyImageSlider> {
  final PageController _pageController = PageController();

  int _currentPage = 0;

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.property.imageUrls.where((url) => url.trim().isNotEmpty).toList();

    return SizedBox(
      height: 220,
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
            child: images.isEmpty
                ? Image.asset(
                    "assets/images/properties/property_placeholder_landscape_1280x853.png",
                    width: double.infinity,
                    height: double.infinity,
                    fit: BoxFit.cover,
                  )
                : PageView.builder(
                    controller: _pageController,
                    itemCount: images.length,
                    onPageChanged: (index) {
                      setState(() {
                        _currentPage = index;
                      });
                    },
                    itemBuilder: (context, index) {
                      return Image.network(
                        images[index],
                        fit: BoxFit.cover,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) {
                            return child;
                          }

                          return Image.asset(
                            "assets/images/properties/property_placeholder_landscape_1280x853.png",
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          return Image.asset(
                            "assets/images/properties/property_placeholder_landscape_1280x853.png",
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                          );
                        },
                      );
                    },
                  ),
          ),

          Positioned(
            top: 12,
            right: 12,
            child: FavoriteButton(
              isFavorite: false,
              onPressed: () {
                // TODO:
                // Connect Favorites API
              },
            ),
          ),

          Positioned(
            top: 12,
            left: 12,
            child: FeaturedBadge(isFeatured: widget.property.isFeatured),
          ),

          if (images.isNotEmpty)
            Positioned(
              bottom: 12,
              right: 12,
              child: Container(
                padding: const EdgeInsets.symmetric(
                  horizontal: 10,
                  vertical: 5,
                ),
                decoration: BoxDecoration(
                  color: Colors.black54,
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text(
                  '${_currentPage + 1}/${images.length}',
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            ),

          if (images.length > 1)
            Positioned(
              bottom: 12,
              left: 0,
              right: 0,
              child: Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  images.length,
                  (index) => AnimatedContainer(
                    duration: const Duration(milliseconds: 250),
                    margin: const EdgeInsets.symmetric(horizontal: 3),
                    width: _currentPage == index ? 18 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _currentPage == index
                          ? Colors.white
                          : Colors.white54,
                      borderRadius: BorderRadius.circular(10),
                    ),
                  ),
                ),
              ),
            ),
        ],
      ),
    );
  }
}

