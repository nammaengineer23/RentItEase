import 'package:flutter/material.dart';

import '../../../../shared/widgets/app_svg_icon.dart';

class HomeBottomNavigation extends StatelessWidget {
  final int currentIndex;
  final ValueChanged<int> onTap;
  final bool ownerMode;

  const HomeBottomNavigation({
    super.key,
    required this.currentIndex,
    required this.onTap,
    this.ownerMode = false,
  });

  @override
  Widget build(BuildContext context) {
    final colorScheme = Theme.of(context).colorScheme;

    return NavigationBar(
      selectedIndex: currentIndex,
      onDestinationSelected: onTap,
      height: 72,
      labelBehavior: NavigationDestinationLabelBehavior.alwaysShow,
      destinations: [
        NavigationDestination(
          icon: AppSvgIcon(
            'assets/images/icons/feature/home.svg',
            size: 24,
            color: colorScheme.onSurfaceVariant,
          ),
          selectedIcon: AppSvgIcon(
            'assets/images/icons/feature/home.svg',
            size: 26,
            color: colorScheme.primary,
          ),
          label: 'Home',
        ),
        NavigationDestination(
          icon: AppSvgIcon(
            'assets/images/icons/feature/search.svg',
            size: 24,
            color: colorScheme.onSurfaceVariant,
          ),
          selectedIcon: AppSvgIcon(
            'assets/images/icons/feature/search.svg',
            size: 26,
            color: colorScheme.primary,
          ),
          label: 'Search',
        ),
        NavigationDestination(
          icon: AppSvgIcon(
            'assets/images/icons/feature/favorites.svg',
            size: 24,
            color: colorScheme.onSurfaceVariant,
          ),
          selectedIcon: AppSvgIcon(
            'assets/images/icons/feature/favorites.svg',
            size: 26,
            color: colorScheme.primary,
          ),
          label: ownerMode ? 'Engagement' : 'Favorites',
        ),
        NavigationDestination(
          icon: AppSvgIcon(
            'assets/images/icons/feature/bookings.svg',
            size: 24,
            color: colorScheme.onSurfaceVariant,
          ),
          selectedIcon: AppSvgIcon(
            'assets/images/icons/feature/bookings.svg',
            size: 26,
            color: colorScheme.primary,
          ),
          label: ownerMode ? 'Visits' : 'Bookings',
        ),
        NavigationDestination(
          icon: AppSvgIcon(
            'assets/images/icons/feature/profile.svg',
            size: 24,
            color: colorScheme.onSurfaceVariant,
          ),
          selectedIcon: AppSvgIcon(
            'assets/images/icons/feature/profile.svg',
            size: 26,
            color: colorScheme.primary,
          ),
          label: 'Profile',
        ),
      ],
    );
  }
}
