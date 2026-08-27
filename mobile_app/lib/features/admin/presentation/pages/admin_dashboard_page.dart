import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../authentication/providers/authentication_provider.dart';
import '../../providers/admin_provider.dart';

class AdminDashboardPage extends ConsumerStatefulWidget {
  const AdminDashboardPage({
    super.key,
    this.loadOnStart = true,
  });

  final bool loadOnStart;

  @override
  ConsumerState<AdminDashboardPage> createState() =>
      _AdminDashboardPageState();
}

class _AdminDashboardPageState extends ConsumerState<AdminDashboardPage> {
  int _index = 0;

  static const _titles = [
    'Admin Dashboard',
    'User Management',
    'Property Management',
    'Reviews & Visits',
    'Platform Analytics',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.loadOnStart) {
      Future.microtask(
        () => ref.read(adminProvider.notifier).loadDashboard(),
      );
    }
  }

  Future<void> _select(int index) async {
    setState(() => _index = index);
    final notifier = ref.read(adminProvider.notifier);

    switch (index) {
      case 0:
        await notifier.loadDashboard();
        break;
      case 1:
        await notifier.loadUsers();
        break;
      case 2:
        await notifier.loadProperties();
        break;
      case 3:
        await notifier.loadReviews();
        await notifier.loadVisits();
        break;
      case 4:
        await notifier.loadAnalytics();
        break;
    }
  }

  Future<void> _logout() async {
    await ref.read(authenticationProvider).logout();
    if (mounted) context.go('/auth');
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminProvider);

    return Scaffold(
      appBar: AppBar(
        title: Text(_titles[_index]),
        actions: [
          IconButton(
            tooltip: 'Profile',
            onPressed: () => context.push('/profile'),
            icon: const Icon(Icons.account_circle_outlined),
          ),
          IconButton(
            tooltip: 'Logout',
            onPressed: _logout,
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Stack(
        children: [
          IndexedStack(
            index: _index,
            children: const [
              _DashboardView(),
              _UsersView(),
              _PropertiesView(),
              _ActivityView(),
              _AnalyticsView(),
            ],
          ),
          if (state.loading)
            const Positioned(
              left: 0,
              right: 0,
              top: 0,
              child: LinearProgressIndicator(),
            ),
        ],
      ),
      bottomNavigationBar: NavigationBar(
        selectedIndex: _index,
        onDestinationSelected: _select,
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Dashboard',
          ),
          NavigationDestination(
            icon: Icon(Icons.people_outline),
            selectedIcon: Icon(Icons.people),
            label: 'Users',
          ),
          NavigationDestination(
            icon: Icon(Icons.apartment_outlined),
            selectedIcon: Icon(Icons.apartment),
            label: 'Properties',
          ),
          NavigationDestination(
            icon: Icon(Icons.fact_check_outlined),
            selectedIcon: Icon(Icons.fact_check),
            label: 'Activity',
          ),
          NavigationDestination(
            icon: Icon(Icons.analytics_outlined),
            selectedIcon: Icon(Icons.analytics),
            label: 'Analytics',
          ),
        ],
      ),
    );
  }
}

class _DashboardView extends ConsumerWidget {
  const _DashboardView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final data = state.dashboard;
    final users = _section(data, 'users');
    final properties = _section(data, 'properties');
    final engagement = _section(data, 'engagement');
    final visits = _section(data, 'visits');

    return _AdminRefreshView(
      error: state.error,
      empty: data.isEmpty,
      onRefresh: ref.read(adminProvider.notifier).loadDashboard,
      child: GridView.count(
        padding: const EdgeInsets.all(16),
        crossAxisCount: MediaQuery.sizeOf(context).width > 650 ? 3 : 2,
        childAspectRatio: 1.15,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        children: [
          _MetricCard('Users', _number(users, 'totalUsers'), Icons.people),
          _MetricCard('Owners', _number(users, 'totalOwners'), Icons.business),
          _MetricCard('Admins', _number(users, 'totalAdmins'), Icons.shield),
          _MetricCard(
            'Properties',
            _number(properties, 'totalProperties'),
            Icons.apartment,
          ),
          _MetricCard(
            'Available',
            _number(properties, 'activeProperties'),
            Icons.check_circle,
          ),
          _MetricCard(
            'Hidden/Rented',
            _number(properties, 'rentedProperties'),
            Icons.visibility_off,
          ),
          _MetricCard(
            'Reviews',
            _number(engagement, 'totalReviews'),
            Icons.reviews,
          ),
          _MetricCard(
            'Favorites',
            _number(engagement, 'totalFavorites'),
            Icons.favorite,
          ),
          _MetricCard(
            'Pending Visits',
            _number(visits, 'pendingVisits'),
            Icons.schedule,
          ),
          _MetricCard(
            'Completed Visits',
            _number(visits, 'completedVisits'),
            Icons.task_alt,
          ),
        ],
      ),
    );
  }
}

class _UsersView extends ConsumerWidget {
  const _UsersView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final notifier = ref.read(adminProvider.notifier);

    return _AdminRefreshView(
      error: state.error,
      empty: state.users.isEmpty,
      onRefresh: notifier.loadUsers,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: state.users.length + state.ownerRequests.length,
        itemBuilder: (context, index) {
          if (index < state.ownerRequests.length) {
            final request = state.ownerRequests[index];
            return Card(
              child: ListTile(
                leading: const CircleAvatar(
                  child: Icon(Icons.storefront_outlined),
                ),
                title: Text(_text(request, 'fullName')),
                subtitle: Text(
                  'Owner approval request\n${_text(request, 'email')}',
                ),
                isThreeLine: true,
                trailing: Wrap(
                  children: [
                    IconButton(
                      tooltip: 'Reject owner request',
                      onPressed: () => notifier.reviewOwnerRequest(
                        _text(request, 'id'),
                        false,
                      ),
                      icon: const Icon(Icons.close, color: Colors.red),
                    ),
                    IconButton(
                      tooltip: 'Approve owner request',
                      onPressed: () => notifier.reviewOwnerRequest(
                        _text(request, 'id'),
                        true,
                      ),
                      icon: const Icon(Icons.check, color: Colors.green),
                    ),
                  ],
                ),
              ),
            );
          }
          final userIndex = index - state.ownerRequests.length;
          final user = state.users[userIndex];
          final active = user['isActive'] == true;
          final role = _text(user, 'role');

          return Card(
            child: ListTile(
              leading: CircleAvatar(
                child: Text(
                  _text(user, 'fullName').isEmpty
                      ? '?'
                      : _text(user, 'fullName')[0].toUpperCase(),
                ),
              ),
              title: Text(_text(user, 'fullName')),
              subtitle: Text(
                '${_text(user, 'email')}\n'
                '$role • ${active ? 'Active' : 'Inactive'} • '
                '${_number(user, 'totalProperties')} properties',
              ),
              isThreeLine: true,
              onTap: () => _showUserDetails(
                context,
                notifier,
                _text(user, 'id'),
              ),
              trailing: PopupMenuButton<String>(
                onSelected: (action) async {
                  if (action == 'toggle') {
                    await _runAction(
                      context,
                      () => notifier.setUserActive(
                        _text(user, 'id'),
                        !active,
                      ),
                      active ? 'User deactivated' : 'User activated',
                    );
                  } else if (action == 'delete' &&
                      await _confirm(
                        context,
                        'Delete user?',
                        'This permanently removes the user and related data.',
                      )) {
                    if (!context.mounted) return;
                    await _runAction(
                      context,
                      () => notifier.deleteUser(_text(user, 'id')),
                      'User deleted',
                    );
                  }
                },
                itemBuilder: (_) => [
                  PopupMenuItem(
                    value: 'toggle',
                    child: Text(active ? 'Deactivate' : 'Activate'),
                  ),
                  if (role != 'ADMIN')
                    const PopupMenuItem(
                      value: 'delete',
                      child: Text('Delete'),
                    ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _PropertiesView extends ConsumerWidget {
  const _PropertiesView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final notifier = ref.read(adminProvider.notifier);

    return _AdminRefreshView(
      error: state.error,
      empty: state.properties.isEmpty,
      onRefresh: notifier.loadProperties,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: state.properties.length,
        itemBuilder: (context, index) {
          final property = state.properties[index];
          final visible = property['isAvailable'] == true;
          final owner = _section(property, 'owner');
          final image = property['primaryImage']?.toString();

          return Card(
            child: ListTile(
              leading: SizedBox.square(
                dimension: 58,
                child: image == null || image.isEmpty
                    ? const Icon(Icons.home_work_outlined)
                    : ClipRRect(
                        borderRadius: BorderRadius.circular(8),
                        child: Image.network(
                          image,
                          fit: BoxFit.cover,
                          errorBuilder: (_, _, _) =>
                              const Icon(Icons.broken_image_outlined),
                        ),
                      ),
              ),
              title: Text(_text(property, 'title')),
              subtitle: Text(
                '${_text(property, 'city')} • ₹${_number(property, 'price')}\n'
                'Owner: ${_text(owner, 'fullName')} • '
                '${visible ? 'Visible' : 'Hidden'}',
              ),
              isThreeLine: true,
              onTap: () => _showPropertyDetails(
                context,
                notifier,
                _text(property, 'id'),
              ),
              trailing: PopupMenuButton<String>(
                onSelected: (action) async {
                  if (action == 'toggle') {
                    await _runAction(
                      context,
                      () => notifier.setPropertyVisible(
                        _text(property, 'id'),
                        !visible,
                      ),
                      visible ? 'Property hidden' : 'Property visible',
                    );
                  } else if (action == 'delete' &&
                      await _confirm(
                        context,
                        'Delete property?',
                        'This permanently removes the property.',
                      )) {
                    if (!context.mounted) return;
                    await _runAction(
                      context,
                      () => notifier.deleteProperty(_text(property, 'id')),
                      'Property deleted',
                    );
                  }
                },
                itemBuilder: (_) => [
                  PopupMenuItem(
                    value: 'toggle',
                    child: Text(visible ? 'Hide' : 'Unhide'),
                  ),
                  const PopupMenuItem(
                    value: 'delete',
                    child: Text('Delete'),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _ActivityView extends ConsumerWidget {
  const _ActivityView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final notifier = ref.read(adminProvider.notifier);

    return DefaultTabController(
      length: 2,
      child: Column(
        children: [
          const TabBar(
            tabs: [
              Tab(text: 'Reviews', icon: Icon(Icons.reviews_outlined)),
              Tab(text: 'Visits', icon: Icon(Icons.event_available_outlined)),
            ],
          ),
          Expanded(
            child: TabBarView(
              children: [
                RefreshIndicator(
                  onRefresh: notifier.loadReviews,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: state.reviews.length,
                    itemBuilder: (context, index) {
                      final review = state.reviews[index];
                      final user = _section(review, 'user');
                      final property = _section(review, 'property');
                      return Card(
                        child: ListTile(
                          title: Text(
                            '${_number(review, 'rating')} ★ • '
                            '${_text(property, 'title')}',
                          ),
                          subtitle: Text(
                            '${_text(review, 'comment')}\n'
                            'By ${_text(user, 'fullName')}',
                          ),
                          isThreeLine: true,
                          trailing: IconButton(
                            tooltip: 'Delete review',
                            icon: const Icon(Icons.delete_outline),
                            onPressed: () async {
                              if (await _confirm(
                                context,
                                'Delete review?',
                                'This review will be permanently removed.',
                              )) {
                                if (!context.mounted) return;
                                await _runAction(
                                  context,
                                  () => notifier.deleteReview(
                                    _text(review, 'id'),
                                  ),
                                  'Review deleted',
                                );
                              }
                            },
                          ),
                        ),
                      );
                    },
                  ),
                ),
                RefreshIndicator(
                  onRefresh: notifier.loadVisits,
                  child: ListView.builder(
                    padding: const EdgeInsets.all(12),
                    itemCount: state.visits.length,
                    itemBuilder: (context, index) {
                      final visit = state.visits[index];
                      final tenant = _section(visit, 'tenant');
                      final property = _section(visit, 'property');
                      final status = _text(visit, 'status');

                      return Card(
                        child: ListTile(
                          title: Text(_text(property, 'title')),
                          subtitle: Text(
                            '${_text(tenant, 'fullName')} • $status\n'
                            '${_text(visit, 'visitDate')}',
                          ),
                          isThreeLine: true,
                          trailing: PopupMenuButton<String>(
                            onSelected: (action) => _runAction(
                              context,
                              () => notifier.updateVisitStatus(
                                _text(visit, 'id'),
                                action,
                              ),
                              'Visit updated',
                            ),
                            itemBuilder: (_) => const [
                              PopupMenuItem(
                                value: 'approve',
                                child: Text('Approve'),
                              ),
                              PopupMenuItem(
                                value: 'reject',
                                child: Text('Reject'),
                              ),
                              PopupMenuItem(
                                value: 'complete',
                                child: Text('Complete'),
                              ),
                            ],
                          ),
                        ),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _AnalyticsView extends ConsumerWidget {
  const _AnalyticsView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final data = state.analytics;
    final users = _section(data, 'users');
    final properties = _section(data, 'properties');
    final engagement = _section(data, 'engagement');

    return _AdminRefreshView(
      error: state.error,
      empty: data.isEmpty,
      onRefresh: ref.read(adminProvider.notifier).loadAnalytics,
      child: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          _AnalyticsSection(
            title: 'Users',
            values: {
              'Total': _number(users, 'total'),
              'Tenants': _number(users, 'tenants'),
              'Owners': _number(users, 'owners'),
              'Admins': _number(users, 'admins'),
              'Active': _number(users, 'active'),
              'Inactive': _number(users, 'inactive'),
            },
          ),
          _AnalyticsSection(
            title: 'Properties',
            values: {
              'Total': _number(properties, 'total'),
              'Available': _number(properties, 'available'),
              'Hidden/Rented': _number(properties, 'rented'),
            },
          ),
          _AnalyticsSection(
            title: 'Engagement',
            values: {
              'Reviews': _number(engagement, 'reviews'),
              'Favorites': _number(engagement, 'favorites'),
              'Visits': _number(engagement, 'visits'),
            },
          ),
        ],
      ),
    );
  }
}

class _AdminRefreshView extends StatelessWidget {
  const _AdminRefreshView({
    required this.error,
    required this.empty,
    required this.onRefresh,
    required this.child,
  });

  final String? error;
  final bool empty;
  final Future<void> Function() onRefresh;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    if (error != null && empty) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              const Icon(Icons.error_outline, size: 56),
              const SizedBox(height: 12),
              Text(error!, textAlign: TextAlign.center),
              const SizedBox(height: 16),
              FilledButton(onPressed: onRefresh, child: const Text('Retry')),
            ],
          ),
        ),
      );
    }
    return RefreshIndicator(onRefresh: onRefresh, child: child);
  }
}

class _MetricCard extends StatelessWidget {
  const _MetricCard(this.label, this.value, this.icon);

  final String label;
  final int value;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(height: 8),
            Text(
              '$value',
              style: Theme.of(context).textTheme.headlineMedium,
            ),
            Text(label, textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

class _AnalyticsSection extends StatelessWidget {
  const _AnalyticsSection({required this.title, required this.values});

  final String title;
  final Map<String, int> values;

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(title, style: Theme.of(context).textTheme.titleLarge),
            const Divider(),
            ...values.entries.map(
              (entry) => ListTile(
                dense: true,
                title: Text(entry.key),
                trailing: Text(
                  '${entry.value}',
                  style: Theme.of(context).textTheme.titleMedium,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

Future<void> _showUserDetails(
  BuildContext context,
  AdminNotifier notifier,
  String id,
) async {
  try {
    final user = await notifier.getUser(id);
    if (!context.mounted) return;
    await _showDetails(
      context,
      'User Details',
      {
        'Name': _text(user, 'fullName'),
        'Email': _text(user, 'email'),
        'Phone': _text(user, 'phone'),
        'Role': _text(user, 'role'),
        'Status': user['isActive'] == true ? 'Active' : 'Inactive',
        'Properties': '${_number(user, 'totalProperties')}',
        'Created': _text(user, 'createdAt'),
      },
    );
  } catch (error) {
    if (context.mounted) _showError(context, error);
  }
}

Future<void> _showPropertyDetails(
  BuildContext context,
  AdminNotifier notifier,
  String id,
) async {
  try {
    final property = await notifier.getProperty(id);
    if (!context.mounted) return;
    final owner = _section(property, 'owner');
    await _showDetails(
      context,
      'Property Details',
      {
        'Title': _text(property, 'title'),
        'Location':
            '${_text(property, 'locality')}, ${_text(property, 'city')}',
        'Price': '₹${_number(property, 'price')}',
        'Owner': _text(owner, 'fullName'),
        'Owner Email': _text(owner, 'email'),
        'Status': property['isAvailable'] == true ? 'Visible' : 'Hidden',
      },
    );
  } catch (error) {
    if (context.mounted) _showError(context, error);
  }
}

Future<void> _showDetails(
  BuildContext context,
  String title,
  Map<String, String> values,
) {
  return showModalBottomSheet<void>(
    context: context,
    showDragHandle: true,
    isScrollControlled: true,
    builder: (_) => SafeArea(
      child: ListView(
        shrinkWrap: true,
        padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
        children: [
          Text(title, style: Theme.of(context).textTheme.headlineSmall),
          const SizedBox(height: 12),
          ...values.entries.map(
            (entry) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(entry.key),
              subtitle: Text(entry.value.isEmpty ? '—' : entry.value),
            ),
          ),
        ],
      ),
    ),
  );
}

Future<bool> _confirm(
  BuildContext context,
  String title,
  String message,
) async {
  return await showDialog<bool>(
        context: context,
        builder: (dialogContext) => AlertDialog(
          title: Text(title),
          content: Text(message),
          actions: [
            TextButton(
              onPressed: () => Navigator.pop(dialogContext, false),
              child: const Text('Cancel'),
            ),
            FilledButton(
              onPressed: () => Navigator.pop(dialogContext, true),
              child: const Text('Confirm'),
            ),
          ],
        ),
      ) ??
      false;
}

Future<void> _runAction(
  BuildContext context,
  Future<void> Function() action,
  String success,
) async {
  try {
    await action();
    if (!context.mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(success), backgroundColor: Colors.green),
    );
  } catch (error) {
    if (context.mounted) _showError(context, error);
  }
}

void _showError(BuildContext context, Object error) {
  ScaffoldMessenger.of(context).showSnackBar(
    SnackBar(content: Text(error.toString()), backgroundColor: Colors.red),
  );
}

Map<String, dynamic> _section(Map<String, dynamic> root, String key) {
  final value = root[key];
  return value is Map ? Map<String, dynamic>.from(value) : const {};
}

String _text(Map<String, dynamic> root, String key) =>
    root[key]?.toString() ?? '';

int _number(Map<String, dynamic> root, String key) {
  final value = root[key];
  if (value is num) return value.toInt();
  return int.tryParse(value?.toString() ?? '') ?? 0;
}
