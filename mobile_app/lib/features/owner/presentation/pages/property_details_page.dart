import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../../core/network/dio_provider.dart';
import '../../../../l10n/app_localizations.dart';
import '../../data/models/owner_property_model.dart';
import '../../providers/owner_provider.dart';
import 'edit_property_page.dart';

class OwnerPropertyDetailsPage extends ConsumerStatefulWidget {
  const OwnerPropertyDetailsPage({super.key, required this.property});

  final OwnerPropertyModel property;

  @override
  ConsumerState<OwnerPropertyDetailsPage> createState() =>
      _OwnerPropertyDetailsPageState();
}

class _OwnerPropertyDetailsPageState
    extends ConsumerState<OwnerPropertyDetailsPage> {
  late final Future<OwnerPropertyModel> _propertyFuture;

  OwnerPropertyModel get property => widget.property;

  @override
  void initState() {
    super.initState();
    _propertyFuture = ref
        .read(ownerRepositoryProvider)
        .getProperty(property.id)
        .then((value) => value as OwnerPropertyModel)
        .catchError((_) => property);
  }

  Future<void> _edit(BuildContext context) async {
    final changed = await Navigator.push<bool>(
      context,
      MaterialPageRoute(builder: (_) => EditPropertyPage(property: property)),
    );

    if (changed == true && context.mounted) {
      Navigator.pop(context, true);
    }
  }

  Future<void> _delete(BuildContext context, WidgetRef ref) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (_) => AlertDialog(
        title: Text(context.tr('deleteProperty')),
        content: Text(context.tr('deletePropertyQuestion')),
        actions: [
          TextButton(
            onPressed: () =>
                Navigator.of(context, rootNavigator: true).pop(false),
            child: Text(context.tr('cancel')),
          ),
          FilledButton(
            onPressed: () =>
                Navigator.of(context, rootNavigator: true).pop(true),
            child: Text(context.tr('delete')),
          ),
        ],
      ),
    );

    if (confirmed != true) return;

    try {
      await ref.read(ownerProvider.notifier).deleteProperty(property.id);

      if (!context.mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(context.tr('propertyDeleted'))));
      Navigator.pop(context, true);
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('${context.tr('propertyDeleteFailed')}: $error'),
        ),
      );
    }
  }

  Future<void> _promote(BuildContext context, WidgetRef ref) async {
    try {
      await ref
          .read(dioProvider)
          .post('/premium-listings/me', data: {'propertyId': property.id});
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text(
            'Property promoted until your Premium membership expires.',
          ),
        ),
      );
    } catch (error) {
      if (!context.mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text('Premium membership required: $error'),
          action: SnackBarAction(
            label: 'View Premium',
            onPressed: () => context.push('/profile/premium'),
          ),
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(context.tr('propertyDetails')),
        actions: [
          IconButton(
            icon: const Icon(Icons.edit),
            onPressed: () => _edit(context),
          ),
        ],
      ),
      body: FutureBuilder<OwnerPropertyModel>(
        future: _propertyFuture,
        builder: (context, snapshot) {
          final detail = snapshot.data ?? property;
          return ListView(
            children: [
              AspectRatio(
                aspectRatio: 16 / 9,
                child: detail.imageUrl.isEmpty
                    ? Container(
                        color: Colors.grey.shade300,
                        child: const Icon(Icons.home, size: 80),
                      )
                    : Image.network(
                        detail.imageUrl,
                        fit: BoxFit.cover,
                        errorBuilder: (context, error, stackTrace) => Container(
                          color: Colors.grey.shade300,
                          child: const Icon(Icons.home, size: 80),
                        ),
                      ),
              ),
              Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      detail.title,
                      style: const TextStyle(
                        fontSize: 24,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 10),
                    Text(
                      '₹${detail.rent.toStringAsFixed(0)} / month',
                      style: const TextStyle(
                        fontSize: 22,
                        color: Colors.green,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const SizedBox(height: 20),
                    _InfoTile(
                      icon: detail.isVerified
                          ? Icons.verified
                          : Icons.pending_outlined,
                      title: 'Status',
                      value: detail.isVerified
                          ? (detail.isAvailable
                                ? 'Verified • Visible'
                                : 'Verified • Hidden')
                          : 'Pending verification',
                    ),
                    if (detail.imageUrls.length > 1) ...[
                      const SizedBox(height: 16),
                      SizedBox(
                        height: 96,
                        child: ListView.separated(
                          scrollDirection: Axis.horizontal,
                          itemCount: detail.imageUrls.length,
                          separatorBuilder: (_, _) => const SizedBox(width: 8),
                          itemBuilder: (context, index) => ClipRRect(
                            borderRadius: BorderRadius.circular(8),
                            child: Image.network(
                              detail.imageUrls[index],
                              width: 128,
                              fit: BoxFit.cover,
                            ),
                          ),
                        ),
                      ),
                    ],
                    if (detail.amenities.isNotEmpty) ...[
                      const SizedBox(height: 20),
                      const Text(
                        'Amenities',
                        style: TextStyle(
                          fontSize: 18,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                      const SizedBox(height: 8),
                      Wrap(
                        spacing: 8,
                        runSpacing: 8,
                        children: detail.amenities
                            .map((amenity) => Chip(label: Text(amenity)))
                            .toList(),
                      ),
                    ],
                    _InfoTile(
                      icon: Icons.location_on,
                      title: context.tr('address'),
                      value:
                          '${detail.address}, ${detail.locality}, ${detail.city}',
                    ),
                    _InfoTile(
                      icon: Icons.apartment,
                      title: context.tr('propertyType'),
                      value: detail.propertyType,
                    ),
                    _InfoTile(
                      icon: Icons.description,
                      title: context.tr('description'),
                      value: detail.description,
                    ),
                    _InfoTile(
                      icon: Icons.visibility,
                      title: context.tr('views'),
                      value: detail.views.toString(),
                    ),
                    _InfoTile(
                      icon: Icons.favorite,
                      title: context.tr('favorites'),
                      value: detail.favorites.toString(),
                    ),
                    _InfoTile(
                      icon: Icons.calendar_today,
                      title: context.tr('visitRequests'),
                      value: detail.visitRequests.toString(),
                    ),
                    const SizedBox(height: 30),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        icon: const Icon(Icons.workspace_premium_outlined),
                        label: const Text('Promote with Premium'),
                        onPressed: () => _promote(context, ref),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: FilledButton.icon(
                        icon: const Icon(Icons.edit),
                        label: Text(context.tr('editProperty')),
                        onPressed: () => _edit(context),
                      ),
                    ),
                    const SizedBox(height: 12),
                    SizedBox(
                      width: double.infinity,
                      child: OutlinedButton.icon(
                        icon: const Icon(Icons.delete),
                        label: Text(context.tr('deleteProperty')),
                        style: OutlinedButton.styleFrom(
                          foregroundColor: Colors.red,
                        ),
                        onPressed: () => _delete(context, ref),
                      ),
                    ),
                  ],
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _InfoTile extends StatelessWidget {
  const _InfoTile({
    required this.icon,
    required this.title,
    required this.value,
  });

  final IconData icon;
  final String title;
  final String value;

  @override
  Widget build(BuildContext context) {
    return ListTile(
      contentPadding: EdgeInsets.zero,
      leading: Icon(icon),
      title: Text(title),
      subtitle: Text(value),
    );
  }
}
