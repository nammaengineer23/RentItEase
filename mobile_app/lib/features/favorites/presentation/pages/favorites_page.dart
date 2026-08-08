import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../providers/favorites_provider.dart';
import '../widgets/favorite_property_card.dart';

class FavoritesPage extends ConsumerStatefulWidget {
  const FavoritesPage({super.key});

  @override
  ConsumerState<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends ConsumerState<FavoritesPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(favoritesProvider.notifier).loadFavorites();
    });
  }

  Future<void> _refresh() async {
    await ref.read(favoritesProvider.notifier).loadFavorites();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(favoritesProvider);

    return Scaffold(
      appBar: AppBar(
        title: const Text('My Favorites ❤️'),
        centerTitle: true,
      ),
      body: Builder(
        builder: (context) {
          if (state.isLoading) {
            return const Center(
              child: CircularProgressIndicator(),
            );
          }

          if (state.error != null) {
            return Center(
              child: Padding(
                padding: const EdgeInsets.all(24),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    const Icon(
                      Icons.error_outline,
                      color: Colors.red,
                      size: 70,
                    ),
                    const SizedBox(height: 16),
                    Text(
                      state.error!,
                      textAlign: TextAlign.center,
                    ),
                    const SizedBox(height: 20),
                    ElevatedButton(
                      onPressed: _refresh,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            );
          }

          if (state.favorites.isEmpty) {
            return RefreshIndicator(
              onRefresh: _refresh,
              child: ListView(
                children: const [
                  SizedBox(height: 180),
                  Icon(
                    Icons.favorite_border,
                    size: 90,
                    color: Colors.grey,
                  ),
                  SizedBox(height: 20),
                  Center(
                    child: Text(
                      'No Favorite Properties',
                      style: TextStyle(
                        fontSize: 18,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  SizedBox(height: 10),
                  Center(
                    child: Text(
                      'Save properties to quickly find them later.',
                    ),
                  ),
                ],
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView.separated(
              padding: const EdgeInsets.all(16),
              itemCount: state.favorites.length,
              separatorBuilder: (_, _) => const SizedBox(height: 16),
              itemBuilder: (context, index) {
                final property = state.favorites[index];

                return FavoritePropertyCard(
                  property: property,

                  onTap: () {
                    context.push('/property/${property.propertyId}');
                  },

                  onRemove: () async {
                    await ref
                        .read(favoritesProvider.notifier)
                        .removeFavorite(property.propertyId);

                    if (!context.mounted) return;

                    ScaffoldMessenger.of(context).showSnackBar(
                      const SnackBar(
                        content: Text('Removed from favorites'),
                      ),
                    );
                  },
                );
              },
            ),
          );
        },
      ),
    );
  }
}