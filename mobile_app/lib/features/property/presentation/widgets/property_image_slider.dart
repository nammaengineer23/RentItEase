import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';

import '../../domain/entities/property_entity.dart';

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
  final Set<String> _failedImages = <String>{};

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final images = widget.property.imageUrls.where((url) => url.trim().isNotEmpty).toList();

    final isDesktop = MediaQuery.sizeOf(context).width >= 700;
    return SizedBox(
      height: isDesktop ? 420 : 220,
      child: Stack(
        children: [
          ClipRRect(
            borderRadius: const BorderRadius.vertical(top: Radius.circular(18)),
            child: images.isEmpty
                ? SvgPicture.asset(
                    'assets/images/properties/property_placeholder.svg',
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
                      final imageUrl = images[index];
                      if (_failedImages.contains(imageUrl)) {
                        return _RetryImage(
                          onRetry: () {
                            PaintingBinding.instance.imageCache.evict(
                              NetworkImage(imageUrl),
                            );
                            setState(() => _failedImages.remove(imageUrl));
                          },
                        );
                      }
                      return Image.network(
                        imageUrl,
                        fit: BoxFit.cover,
                        loadingBuilder: (context, child, loadingProgress) {
                          if (loadingProgress == null) {
                            return child;
                          }

                          return SvgPicture.asset(
                            'assets/images/properties/property_placeholder.svg',
                            width: double.infinity,
                            height: double.infinity,
                            fit: BoxFit.cover,
                          );
                        },
                        errorBuilder: (context, error, stackTrace) {
                          WidgetsBinding.instance.addPostFrameCallback((_) {
                            if (mounted) setState(() => _failedImages.add(imageUrl));
                          });
                          return const SizedBox.expand();
                        },
                      );
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
            if (isDesktop) ...[
              _GalleryArrow(
                alignment: Alignment.centerLeft,
                icon: Icons.chevron_left,
                onPressed: _currentPage > 0
                    ? () => _pageController.previousPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut)
                    : null,
              ),
              _GalleryArrow(
                alignment: Alignment.centerRight,
                icon: Icons.chevron_right,
                onPressed: _currentPage < images.length - 1
                    ? () => _pageController.nextPage(duration: const Duration(milliseconds: 250), curve: Curves.easeOut)
                    : null,
              ),
            ],
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

class _RetryImage extends StatelessWidget {
  const _RetryImage({required this.onRetry});
  final VoidCallback onRetry;
  @override
  Widget build(BuildContext context) => Stack(fit: StackFit.expand, children: [
    SvgPicture.asset('assets/images/properties/property_placeholder.svg', fit: BoxFit.cover),
    Center(child: FilledButton.icon(onPressed: onRetry, icon: const Icon(Icons.refresh), label: const Text('Retry image'))),
  ]);
}

class _GalleryArrow extends StatelessWidget {
  const _GalleryArrow({required this.alignment, required this.icon, required this.onPressed});
  final Alignment alignment; final IconData icon; final VoidCallback? onPressed;
  @override
  Widget build(BuildContext context) => Align(alignment: alignment, child: Padding(padding: const EdgeInsets.all(16), child: IconButton.filledTonal(onPressed: onPressed, icon: Icon(icon))));
}
