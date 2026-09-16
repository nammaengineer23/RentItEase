import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:geolocator/geolocator.dart';
import 'package:geocoding/geocoding.dart';

import '../../../../core/network/dio_provider.dart';
import '../../../../l10n/app_localizations.dart';
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
  String _nearbyCity = '';
  Position? _currentPosition;
  bool _ownerRequestSubmitted = false;
  bool _submittingOwnerRequest = false;

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
      String city = '';
      try {
        final placemarks = await placemarkFromCoordinates(
          position.latitude,
          position.longitude,
        );
        city = placemarks.isEmpty
            ? ''
            : (placemarks.first.locality ??
                placemarks.first.subAdministrativeArea ??
                '');
      } catch (_) {
        // Nearby results are still useful when reverse geocoding is unavailable.
      }
      if (mounted) {
        setState(() {
          _nearbyProperties = nearby;
          _nearbyCity = city.trim();
          _currentPosition = position;
        });
      }
    } catch (_) {
      // The all-properties feed remains available when location is unavailable.
    }
  }

  Future<void> _requestOwnerAccess() async {
    if (_ownerRequestSubmitted || _submittingOwnerRequest) return;

    final confirmed = await showDialog<bool>(
          context: context,
          builder: (dialogContext) => AlertDialog(
            title: const Text('Become an Owner'),
            content: const Text(
              'Send a request to the RentItEase admin team? You can list and manage properties after the request is approved.',
            ),
            actions: [
              TextButton(
                onPressed: () => Navigator.pop(dialogContext, false),
                child: const Text('Cancel'),
              ),
              FilledButton(
                onPressed: () => Navigator.pop(dialogContext, true),
                child: const Text('Send request'),
              ),
            ],
          ),
        ) ??
        false;

    if (!confirmed || !mounted) return;

    setState(() => _submittingOwnerRequest = true);
    try {
      await ref.read(dioProvider).patch('/users/request-owner');
      if (!mounted) return;
      setState(() => _ownerRequestSubmitted = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Owner request sent. Pending admin approval.'),
        ),
      );
    } catch (error) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Unable to submit request: $error')),
      );
    } finally {
      if (mounted) setState(() => _submittingOwnerRequest = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final propertyState = ref.watch(propertyProvider);
    final notificationState = ref.watch(notificationsProvider);
    final authState = ref.watch(authenticationProvider);
    final currentUserId = authState.authResponse?.user.id;
    final currentRole = authState.authResponse?.user.role.trim().toUpperCase();

    return Scaffold(
      appBar: AppBar(
        elevation: 0,
        title: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              'RentItEase',
              style: TextStyle(fontWeight: FontWeight.bold, fontSize: 22),
            ),
            Text(
              context.tr('findPerfectHome'),
              style: const TextStyle(fontSize: 14),
            ),
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
            tooltip: context.tr('logout'),
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
              const SizedBox(height: 12),
              ElevatedButton(
                onPressed: () {
                  ref.read(propertyProvider.notifier).loadProperties();
                },
                child: Text(context.tr('retry')),
              ),
            ],
          ),
        ),
        data: (properties) {
          final nearby = _nearbyProperties ?? const <PropertyEntity>[];
          final available = properties
              .where((property) => property.isAvailable && property.isVerified)
              .toList();
          final nearbyIds = nearby.map((property) => property.id).toSet();
          final cityProperties = available
              .where(
                (property) =>
                    !nearbyIds.contains(property.id) &&
                    _nearbyCity.isNotEmpty &&
                    property.city.trim().toLowerCase() ==
                        _nearbyCity.toLowerCase(),
              )
              .toList()
            ..sort(_compareByDistance);
          final cityIds = cityProperties.map((property) => property.id).toSet();
          final remaining = available
              .where(
                (property) =>
                    !nearbyIds.contains(property.id) &&
                    !cityIds.contains(property.id),
              )
              .toList()
            ..sort(_compareByDistance);
          final visibleFeed = _nearbyProperties == null
              ? available
              : [...nearby, ...cityProperties, ...remaining];

          return Column(
            children: [
              if (currentRole == 'USER')
                Padding(
                  padding: const EdgeInsets.fromLTRB(12, 8, 12, 4),
                  child: Card(
                    child: SwitchListTile.adaptive(
                      secondary: const Icon(Icons.storefront_outlined),
                      title: const Text('Become an Owner'),
                      subtitle: Text(
                        _ownerRequestSubmitted
                            ? 'Owner request pending admin approval'
                            : 'List and manage your rental properties',
                      ),
                      value: _ownerRequestSubmitted,
                      onChanged: _ownerRequestSubmitted || _submittingOwnerRequest
                          ? null
                          : (value) {
                              if (value) void _requestOwnerAccess();
                            },
                    ),
                  ),
                ),
              Expanded(
                child: visibleFeed.isEmpty
                    ? Center(child: Text(context.tr('noNearbyProperties')))
                    : PageView.builder(
                        scrollDirection: Axis.vertical,
                        itemCount: visibleFeed.length,
                        itemBuilder: (context, index) {
                          final property = visibleFeed[index];
                          return SingleChildScrollView(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: PropertyCard(
                              property: property,
                              onTap: () => _openProperty(property),
                              onBookVisit: property.ownerId == currentUserId
                                  ? null
                                  : () => context.push(
                                        '/book-visit/${property.id}',
                                        extra: {
                                          'propertyTitle': property.title,
                                          'propertyImage': property.imageUrls.isNotEmpty
                                              ? property.imageUrls.first
                                              : '',
                                          'ownerName': property.ownerName,
                                        },
                                      ),
                              onContactOwner: property.ownerId == currentUserId
                                  ? null
                                  : () => _openPropertyChat(property),
                            ),
                          );
                        },
                      ),
              ),
            ],
          );
        },
      ),
    );
  }

  int _compareByDistance(PropertyEntity first, PropertyEntity second) {
    final position = _currentPosition;
    if (position == null) return 0;
    return _distanceFrom(position, first).compareTo(
      _distanceFrom(position, second),
    );
  }

  double _distanceFrom(Position position, PropertyEntity property) {
    if (property.latitude == 0 && property.longitude == 0) {
      return double.infinity;
    }
    return Geolocator.distanceBetween(
      position.latitude,
      position.longitude,
      property.latitude,
      property.longitude,
    );
  }

  Future<void> _openProperty(PropertyEntity property) async {
    await context.push('/property/${property.id}');
    await ref.read(propertyProvider.notifier).refreshProperty(property.id);
  }

  void _openPropertyChat(PropertyEntity property) {
    context.push(
      Uri(
        path: '/chat',
        queryParameters: {
          'propertyId': property.id,
          'userName': property.ownerName,
          'propertyTitle': property.title,
          if (property.imageUrls.isNotEmpty)
            'propertyImage': property.imageUrls.first,
        },
      ).toString(),
    );
  }
}
