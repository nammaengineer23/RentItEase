import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';

import '../../../notifications/providers/notifications_provider.dart';
import '../../../authentication/providers/authentication_provider.dart';
import '../../../property/domain/entities/property_entity.dart';
import '../../../property/providers/property_provider.dart';

import '../../../property/presentation/widgets/property_card.dart';

class HomePage extends ConsumerStatefulWidget {
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  List<PropertyEntity>? _nearbyProperties;

  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(notificationsProvider.notifier).loadNotifications();

      ref.read(propertyProvider.notifier).loadProperties();
      _loadNearbyProperties();
    });
  }

  Future<void> _loadNearbyProperties() async {
    try {
      var permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
      }
      if (permission == LocationPermission.denied ||
          permission == LocationPermission.deniedForever) {
        return;
      }

      final position = await Geolocator.getCurrentPosition();
      final nearby = await ref
          .read(propertyProvider.notifier)
          .getNearbyProperties(
            latitude: position.latitude,
            longitude: position.longitude,
            radius: 25,
          );
      if (mounted) setState(() => _nearbyProperties = nearby);
    } catch (_) {
      // The all-properties feed remains available when location is unavailable.
    }
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
          IconButton(
            tooltip: 'Logout',
            onPressed: () async {
              await ref.read(authenticationProvider).logout();
              if (context.mounted) context.go('/auth');
            },
            icon: const Icon(Icons.logout),
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
          final feed = (_nearbyProperties?.isNotEmpty == true)
              ? _nearbyProperties!
              : properties.where((property) => property.isAvailable).toList();

          if (feed.isEmpty) {
            return const Center(child: Text('No nearby properties available.'));
          }

          return PageView.builder(
            scrollDirection: Axis.vertical,
            itemCount: feed.length,
            itemBuilder: (context, index) {
              final property = feed[index];
              return SingleChildScrollView(
                padding: const EdgeInsets.only(bottom: 16),
                child: PropertyCard(
                  property: property,
                  onTap: () => _openProperty(property),
                  onBookVisit: () => context.push(
                    '/book-visit/${property.id}',
                    extra: {
                      'propertyTitle': property.title,
                      'propertyImage': property.imageUrls.isNotEmpty
                          ? property.imageUrls.first
                          : '',
                      'ownerName': property.ownerName,
                    },
                  ),
                  onContactOwner: () => context.push(
                    '/chat',
                    extra: {'propertyId': property.id},
                  ),
                ),
              );
            },
          );
        },
      ),
    );
  }

  void _openProperty(PropertyEntity property) {
    context.push('/property/${property.id}');
  }
}
