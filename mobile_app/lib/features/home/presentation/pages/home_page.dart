import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../notifications/providers/notifications_provider.dart';
import '../../../property/domain/entities/property_entity.dart';
import '../../../property/providers/property_provider.dart';

import '../widgets/bottom_navigation.dart';
import '../widgets/category_grid.dart';
import '../widgets/featured_properties.dart';
import '../widgets/nearby_properties.dart';
import '../widgets/recent_search_widget.dart';
import '../widgets/search_section.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  int _currentIndex = 0;

  final List<String> _recentSearches = ['Whitefield', '2 BHK', 'Under ₹20,000'];

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(notificationsProvider.notifier).loadNotifications();

      ref.read(propertyProvider.notifier).loadProperties();
    });
  }

  @override
  Widget build(BuildContext context) {
    final propertyState = ref.watch(propertyProvider);

    final notificationState = ref.watch(notificationsProvider);

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: const Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'RentItEase',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
            ),
            Text('Find your perfect home', style: TextStyle(fontSize: 13)),
          ],
        ),
        actions: [
          Stack(
            children: [
              IconButton(
                onPressed: () {
                  context.push('/notifications');
                },
                icon: const Icon(Icons.notifications_none),
              ),
              if (notificationState.unreadCount > 0)
                Positioned(
                  right: 8,
                  top: 8,
                  child: Container(
                    padding: const EdgeInsets.all(4),
                    decoration: const BoxDecoration(
                      color: Colors.red,
                      shape: BoxShape.circle,
                    ),
                    child: Text(
                      notificationState.unreadCount.toString(),
                      style: const TextStyle(color: Colors.white, fontSize: 10),
                    ),
                  ),
                ),
            ],
          ),
        ],
      ),
      body: propertyState.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 60, color: Colors.red),
              const SizedBox(height: 12),
              Text(error.toString(), textAlign: TextAlign.center),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: () {
                  ref.read(propertyProvider.notifier).loadProperties();
                },
                child: const Text('Retry'),
              ),
            ],
          ),
        ),
        data: (properties) {
          final featured = properties.where((e) => e.isFeatured).toList();

          return RefreshIndicator(
            onRefresh: () async {
              await ref.read(propertyProvider.notifier).refresh();
            },
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SearchSection(onChanged: (value) {}),

                  const SizedBox(height: 10),

                  const CategoryGrid(),

                  const SizedBox(height: 28),

                  FeaturedProperties(
                    properties: featured,
                    onTap: _openProperty,
                  ),

                  const SizedBox(height: 30),

                  RecentSearchWidget(
                    recentSearches: _recentSearches,
                    onSearchSelected: (search) {},
                    onDeleteSearch: (search) {
                      setState(() {
                        _recentSearches.remove(search);
                      });
                    },
                  ),

                  const SizedBox(height: 20),

                  NearbyProperties(
                    properties: properties,
                    onTap: _openProperty,
                  ),

                  const SizedBox(height: 20),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: HomeBottomNavigation(
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });

          switch (index) {
            case 0:
              context.go('/home');
              break;

            case 1:
              context.push('/search');
              break;

            case 2:
              context.push('/favorites');
              break;

            case 3:
              context.push('/notifications');
              break;

            case 4:
              context.push('/profile');
              break;
          }
        },
      ),
    );
  }

  void _openProperty(PropertyEntity property) {
    context.push('/property/${property.id}');
  }
}
