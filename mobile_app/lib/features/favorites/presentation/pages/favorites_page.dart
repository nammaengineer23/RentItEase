import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../l10n/app_localizations.dart';
import '../../providers/favorites_provider.dart';
import '../widgets/favorite_property_card.dart';

class FavoritesPage extends ConsumerStatefulWidget {
  const FavoritesPage({super.key});

  @override
  ConsumerState<FavoritesPage> createState() => _FavoritesPageState();
}

class _FavoritesPageState extends ConsumerState<FavoritesPage> {
  final _searchController = TextEditingController();
  String _query = '';

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
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(favoritesProvider);

    return Scaffold(
      appBar: AppBar(title: Text(context.tr('myFavorites')), centerTitle: true),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 8),
            child: TextField(
              controller: _searchController,
              onChanged: (value) => setState(() => _query = value.trim()),
              decoration: InputDecoration(
                hintText: context.tr('searchFavorites'),
                prefixIcon: const Icon(Icons.search),
                suffixIcon: _query.isEmpty
                    ? null
                    : IconButton(
                        onPressed: () {
                          _searchController.clear();
                          setState(() => _query = '');
                        },
                        icon: const Icon(Icons.clear),
                      ),
                border: const OutlineInputBorder(),
              ),
            ),
          ),
          Expanded(child: _buildBody(context, state)),
        ],
      ),
    );
  }

  Widget _buildBody(BuildContext context, FavoritesState state) {
    if (state.isLoading && state.favorites.isEmpty) {
      return const Center(child: CircularProgressIndicator());
    }

    if (state.error != null && state.favorites.isEmpty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 70),
              const SizedBox(height: 16),
              Text(state.error!, textAlign: TextAlign.center),
              const SizedBox(height: 20),
              ElevatedButton(
                onPressed: _refresh,
                child: Text(context.tr('retry')),
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
          physics: const AlwaysScrollableScrollPhysics(),
          children: [
            const SizedBox(height: 180),
            const Icon(Icons.favorite_border, size: 90),
            const SizedBox(height: 20),
            Center(
              child: Text(
                context.tr('noFavoriteProperties'),
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
            const SizedBox(height: 10),
            Center(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24),
                child: Text(
                  context.tr('saveFavorites'),
                  textAlign: TextAlign.center,
                ),
              ),
            ),
          ],
        ),
      );
    }

    final query = _query.toLowerCase();
    final favorites = state.favorites.where((property) {
      if (query.isEmpty) return true;
      return property.title.toLowerCase().contains(query) ||
          property.location.toLowerCase().contains(query) ||
          property.propertyType.toLowerCase().contains(query);
    }).toList();

    if (favorites.isEmpty) {
      return Center(child: Text(context.tr('noMatchingFavorites')));
    }

    return RefreshIndicator(
      onRefresh: _refresh,
      child: ListView.separated(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        itemCount: favorites.length,
        separatorBuilder: (_, _) => const SizedBox(height: 16),
        itemBuilder: (context, index) {
          final property = favorites[index];

          return FavoritePropertyCard(
            property: property,
            onTap: () {
              context.push('/property/${property.propertyId}');
            },
            onRemove: () async {
              final success = await ref
                  .read(favoritesProvider.notifier)
                  .removeFavorite(property.propertyId);

              if (!context.mounted) return;

              ScaffoldMessenger.of(context).showSnackBar(
                SnackBar(
                  content: Text(
                    success
                        ? context.tr('removedFavorite')
                        : context.tr('removeFavoriteFailed'),
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }
}
