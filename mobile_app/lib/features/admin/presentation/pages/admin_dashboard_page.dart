import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:url_launcher/url_launcher.dart';

import '../../../authentication/providers/authentication_provider.dart';
import '../../providers/admin_provider.dart';

final _adminUserQueryProvider = StateProvider<String>((_) => '');
final _adminUserRoleProvider = StateProvider<String>((_) => 'ALL');
final _adminUserStatusProvider = StateProvider<String>((_) => 'ALL');
final _adminPremiumQueryProvider = StateProvider<String>((_) => '');
final _adminPremiumStatusProvider = StateProvider<String>((_) => 'ALL');

class AdminDashboardPage extends ConsumerStatefulWidget {
  const AdminDashboardPage({super.key, this.loadOnStart = true});

  final bool loadOnStart;

  @override
  ConsumerState<AdminDashboardPage> createState() => _AdminDashboardPageState();
}

class _AdminDashboardPageState extends ConsumerState<AdminDashboardPage> {
  int _index = 0;

  static const _titles = [
    'Admin Dashboard',
    'Premium Memberships',
    'Social Media',
    'Reviews & Visits',
    'Platform Analytics',
    'User Management',
    'Property Management',
    'Billing',
  ];

  @override
  void initState() {
    super.initState();
    if (widget.loadOnStart) {
      Future.microtask(() => ref.read(adminProvider.notifier).loadDashboard());
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
        await notifier.loadMemberships();
        break;
      case 2:
        await notifier.loadSocialMedia();
        break;
      case 3:
        await notifier.loadReviews();
        await notifier.loadVisits();
        break;
      case 4:
        await notifier.loadAnalytics();
        break;
      case 5:
        await notifier.loadUsers();
        break;
      case 6:
        await notifier.loadProperties();
        break;
      case 7:
        await notifier.loadBilling();
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
            tooltip: 'Search admin records',
            onPressed: () => _showAdminSearch(context, ref),
            icon: const Icon(Icons.search),
          ),
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
            children: [
              _DashboardView(onSelect: _select),
              const _PremiumView(),
              _SocialMediaView(loadSettingsOnStart: widget.loadOnStart),
              const _ActivityView(),
              const _AnalyticsView(),
              const _UsersView(),
              const _PropertiesView(),
              const _BillingView(),
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
        selectedIndex: const [0, 5, 2, 3, 4].contains(_index)
            ? const [0, 5, 2, 3, 4].indexOf(_index)
            : 0,
        onDestinationSelected: (navIndex) =>
            _select(const [0, 5, 2, 3, 4][navIndex]),
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
            icon: Icon(Icons.campaign_outlined),
            selectedIcon: Icon(Icons.campaign),
            label: 'Social',
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
  const _DashboardView({required this.onSelect});

  final ValueChanged<int> onSelect;

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
          _MetricCard(
            'Users',
            _number(users, 'totalUsers'),
            Icons.people,
            onTap: () => onSelect(5),
          ),
          _MetricCard(
            'Owners',
            _number(users, 'totalOwners'),
            Icons.business,
            onTap: () => onSelect(5),
          ),
          _MetricCard(
            'Admins',
            _number(users, 'totalAdmins'),
            Icons.shield,
            onTap: () => onSelect(5),
          ),
          _MetricCard(
            'Properties',
            _number(properties, 'totalProperties'),
            Icons.apartment,
            onTap: () => onSelect(6),
          ),
          _MetricCard(
            'Available',
            _number(properties, 'activeProperties'),
            Icons.check_circle,
            onTap: () => onSelect(6),
          ),
          _MetricCard(
            'Hidden/Rented',
            _number(properties, 'rentedProperties'),
            Icons.visibility_off,
            onTap: () => onSelect(6),
          ),
          _MetricCard(
            'Reviews',
            _number(engagement, 'totalReviews'),
            Icons.reviews,
            onTap: () => onSelect(3),
          ),
          _MetricCard(
            'Favorites',
            _number(engagement, 'totalFavorites'),
            Icons.favorite,
            onTap: () => onSelect(4),
          ),
          _MetricCard(
            'Pending Visits',
            _number(visits, 'pendingVisits'),
            Icons.schedule,
            onTap: () => onSelect(3),
          ),
          _MetricCard(
            'Completed Visits',
            _number(visits, 'completedVisits'),
            Icons.task_alt,
            onTap: () => onSelect(3),
          ),
          _MetricCard(
            'Billing',
            _number(data, 'revenue'),
            Icons.receipt_long_outlined,
            onTap: () => onSelect(7),
          ),
        ],
      ),
    );
  }
}

Future<void> _showAdminSearch(BuildContext context, WidgetRef ref) async {
  final controller = TextEditingController();
  var results = <Map<String, dynamic>>[];
  var loading = false;
  await showDialog<void>(
    context: context,
    builder: (dialogContext) => StatefulBuilder(
      builder: (context, setState) => AlertDialog(
        title: const Text('Search admin records'),
        content: SizedBox(
          width: 560,
          height: 440,
          child: Column(children: [
            TextField(
              controller: controller,
              autofocus: true,
              decoration: const InputDecoration(
                prefixIcon: Icon(Icons.search),
                hintText: 'Users, properties, visits, invoices…',
                border: OutlineInputBorder(),
              ),
              onChanged: (value) async {
                if (value.trim().length < 2) {
                  setState(() => results = []);
                  return;
                }
                setState(() => loading = true);
                try {
                  final found = await ref.read(adminProvider.notifier).searchRecords(value.trim());
                  if (context.mounted) setState(() => results = found);
                } finally {
                  if (context.mounted) setState(() => loading = false);
                }
              },
            ),
            if (loading) const LinearProgressIndicator(),
            const SizedBox(height: 8),
            Expanded(
              child: results.isEmpty
                  ? const Center(child: Text('Enter at least 2 characters to search.'))
                  : ListView.builder(
                      itemCount: results.length,
                      itemBuilder: (_, index) {
                        final item = results[index];
                        return ListTile(
                          leading: const Icon(Icons.manage_search),
                          title: Text(_text(item, 'title')),
                          subtitle: Text('${_text(item, 'type')} • ${_text(item, 'subtitle')}'),
                        );
                      },
                    ),
            ),
          ]),
        ),
        actions: [TextButton(onPressed: () => Navigator.pop(dialogContext), child: const Text('Close'))],
      ),
    ),
  );
  controller.dispose();
}

class _UsersView extends ConsumerWidget {
  const _UsersView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final notifier = ref.read(adminProvider.notifier);
    final query = ref.watch(_adminUserQueryProvider).trim().toLowerCase();
    final roleFilter = ref.watch(_adminUserRoleProvider);
    final statusFilter = ref.watch(_adminUserStatusProvider);
    final visibleUsers = state.users.where((user) {
      final role = _text(user, 'role').toUpperCase();
      final matchesQuery =
          query.isEmpty ||
          _text(user, 'fullName').toLowerCase().contains(query) ||
          _text(user, 'email').toLowerCase().contains(query) ||
          _text(user, 'phone').contains(query);
      final matchesRole =
          roleFilter == 'ALL' ||
          role == roleFilter ||
          (roleFilter == 'TENANT' && role == 'USER');
      final matchesStatus =
          statusFilter == 'ALL' ||
          (statusFilter == 'ACTIVE' && user['isActive'] == true) ||
          (statusFilter == 'INACTIVE' && user['isActive'] != true);
      return matchesQuery && matchesRole && matchesStatus;
    }).toList();
    final activeUsers = state.users
        .where((user) => user['isActive'] == true)
        .length;
    final owners = state.users
        .where((user) => _text(user, 'role').toUpperCase() == 'OWNER')
        .length;
    final tenants = state.users.where((user) {
      final role = _text(user, 'role').toUpperCase();
      return role == 'USER' || role == 'TENANT';
    }).length;

    return _AdminRefreshView(
      error: state.error,
      empty: state.users.isEmpty,
      onRefresh: notifier.loadUsers,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: visibleUsers.length + state.ownerRequests.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      _AdminStatCard(
                        label: 'Total',
                        value: state.users.length.toString(),
                        icon: Icons.people_outline,
                      ),
                      _AdminStatCard(
                        label: 'Active',
                        value: activeUsers.toString(),
                        icon: Icons.verified_user_outlined,
                      ),
                      _AdminStatCard(
                        label: 'Owners',
                        value: owners.toString(),
                        icon: Icons.home_work_outlined,
                      ),
                      _AdminStatCard(
                        label: 'Tenants',
                        value: tenants.toString(),
                        icon: Icons.person_outline,
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  TextField(
                    onChanged: (value) =>
                        ref.read(_adminUserQueryProvider.notifier).state =
                            value,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      hintText: 'Search name, email or phone',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final filter in const [
                          ('ALL', 'All'),
                          ('ADMIN', 'Admin'),
                          ('OWNER', 'Owner'),
                          ('TENANT', 'Tenant'),
                        ])
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(filter.$2),
                              selected: roleFilter == filter.$1,
                              onSelected: (_) =>
                                  ref
                                          .read(_adminUserRoleProvider.notifier)
                                          .state =
                                      filter.$1,
                            ),
                          ),
                        for (final filter in const [
                          ('ALL', 'Any status'),
                          ('ACTIVE', 'Active'),
                          ('INACTIVE', 'Inactive'),
                        ])
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(filter.$2),
                              selected: statusFilter == filter.$1,
                              onSelected: (_) =>
                                  ref
                                      .read(_adminUserStatusProvider.notifier)
                                      .state = filter
                                      .$1,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }
          index--;
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
          final user = visibleUsers[userIndex];
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
              title: Text(
                _text(user, 'fullName'),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              subtitle: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    _text(user, 'email'),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  Text(
                    '$role • ${active ? 'Active' : 'Inactive'} • '
                    '${_number(user, 'totalProperties')} properties',
                  ),
                ],
              ),
              isThreeLine: true,
              onTap: () =>
                  _showUserDetails(context, notifier, _text(user, 'id')),
              trailing: Wrap(
                crossAxisAlignment: WrapCrossAlignment.center,
                children: [
                  if (_text(user, 'phone').isNotEmpty)
                    IconButton(
                      tooltip: 'Call ${_text(user, 'fullName')}',
                      onPressed: () => launchUrl(
                        Uri.parse('tel:${_text(user, 'phone')}'),
                        mode: LaunchMode.externalApplication,
                      ),
                      icon: const Icon(Icons.phone_outlined),
                    ),
                  PopupMenuButton<String>(
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
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _AdminStatCard extends StatelessWidget {
  const _AdminStatCard({
    required this.label,
    required this.value,
    required this.icon,
  });
  final String label;
  final String value;
  final IconData icon;

  @override
  Widget build(BuildContext context) => SizedBox(
    width: (MediaQuery.sizeOf(context).width - 40) / 2,
    child: Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Icon(icon, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 10),
            Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  value,
                  style: Theme.of(
                    context,
                  ).textTheme.titleLarge?.copyWith(fontWeight: FontWeight.w800),
                ),
                Text(label),
              ],
            ),
          ],
        ),
      ),
    ),
  );
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
          final verified = property['isVerified'] == true;
          final owner = _section(property, 'owner');
          final image = property['primaryImage']?.toString();

          return Card(
            clipBehavior: Clip.antiAlias,
            child: InkWell(
              onTap: () => _showPropertyDetails(
                context,
                notifier,
                _text(property, 'id'),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  SizedBox(
                    height: 180,
                    child: image == null || image.isEmpty
                        ? const ColoredBox(
                            color: Color(0xFFF0F0F0),
                            child: Icon(Icons.home_work_outlined, size: 64),
                          )
                        : Image.network(
                            image,
                            fit: BoxFit.cover,
                            errorBuilder: (_, _, _) => const ColoredBox(
                              color: Color(0xFFF0F0F0),
                              child: Icon(Icons.broken_image_outlined, size: 56),
                            ),
                          ),
                  ),
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          _text(property, 'title'),
                          style: Theme.of(context).textTheme.titleLarge?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 6),
                        Text(
                          '${_text(property, 'locality')}, ${_text(property, 'city')}',
                        ),
                        const SizedBox(height: 8),
                        Text(
                          '₹${_number(property, 'price')} / month',
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                fontWeight: FontWeight.bold,
                              ),
                        ),
                        const SizedBox(height: 8),
                        Text('Owner: ${_text(owner, 'fullName')}'),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            Chip(
                              avatar: Icon(
                                verified ? Icons.verified : Icons.pending_outlined,
                                size: 18,
                              ),
                              label: Text(
                                verified ? 'Approved' : 'Pending approval',
                              ),
                            ),
                            Chip(
                              avatar: Icon(
                                visible ? Icons.visibility : Icons.visibility_off,
                                size: 18,
                              ),
                              label: Text(visible ? 'Visible' : 'Hidden'),
                            ),
                          ],
                        ),
                        const SizedBox(height: 12),
                        Wrap(
                          spacing: 8,
                          runSpacing: 8,
                          children: [
                            if (!verified)
                              FilledButton.icon(
                                onPressed: () => _runAction(
                                  context,
                                  () => notifier.approveProperty(
                                    _text(property, 'id'),
                                  ),
                                  'Property and owner approved',
                                ),
                                icon: const Icon(Icons.check_circle_outline),
                                label: const Text('Approve'),
                              ),
                            OutlinedButton.icon(
                              onPressed: () => _showPropertyDetails(
                                context,
                                notifier,
                                _text(property, 'id'),
                              ),
                              icon: const Icon(Icons.visibility_outlined),
                              label: const Text('Review'),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => _runAction(
                                context,
                                () => notifier.setPropertyVisible(
                                  _text(property, 'id'),
                                  !visible,
                                ),
                                visible ? 'Property hidden' : 'Property visible',
                              ),
                              icon: Icon(
                                visible ? Icons.visibility_off : Icons.visibility,
                              ),
                              label: Text(visible ? 'Hide' : 'Unhide'),
                            ),
                            OutlinedButton.icon(
                              onPressed: () => _runAction(
                                context,
                                () => notifier.markPropertyPremium(
                                  _text(property, 'id'),
                                  _text(owner, 'id'),
                                ),
                                'Property marked premium for 30 days',
                              ),
                              icon: const Icon(Icons.workspace_premium_outlined),
                              label: const Text('Premium'),
                            ),
                            OutlinedButton.icon(
                              onPressed: () async {
                                if (!await _confirm(
                                  context,
                                  'Delete property?',
                                  'This permanently removes the property.',
                                )) return;
                                if (!context.mounted) return;
                                await _runAction(
                                  context,
                                  () => notifier.deleteProperty(
                                    _text(property, 'id'),
                                  ),
                                  'Property deleted',
                                );
                              },
                              icon: const Icon(Icons.delete_outline),
                              label: const Text('Delete'),
                            ),
                          ],
                        ),
                      ],
                    ),
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

class _PremiumView extends ConsumerWidget {
  const _PremiumView();

  Future<void> _showDetails(
    BuildContext context,
    Map<String, dynamic> membership,
  ) async {
    final user = _section(membership, 'user');
    final plan = _section(membership, 'plan');
    await showDialog<void>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Membership details'),
        content: SelectableText(
          'Member: ${_text(user, 'fullName')}\n'
          'Email: ${_text(user, 'email')}\n'
          'Plan: ${_text(plan, 'name')}\n'
          'Status: ${_text(membership, 'status')}\n'
          'Starts: ${_text(membership, 'startDate')}\n'
          'Ends: ${_text(membership, 'endDate')}',
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Close'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final query = ref.watch(_adminPremiumQueryProvider).trim().toLowerCase();
    final statusFilter = ref.watch(_adminPremiumStatusProvider);
    final memberships = state.memberships.where((membership) {
      final user = _section(membership, 'user');
      final plan = _section(membership, 'plan');
      final status = _text(membership, 'status').toUpperCase();
      final matchesQuery = query.isEmpty ||
          _text(user, 'fullName').toLowerCase().contains(query) ||
          _text(user, 'email').toLowerCase().contains(query) ||
          _text(plan, 'name').toLowerCase().contains(query) ||
          status.toLowerCase().contains(query);
      return matchesQuery && (statusFilter == 'ALL' || status == statusFilter);
    }).toList();
    return _AdminRefreshView(
      error: state.error,
      empty: state.memberships.isEmpty,
      onRefresh: ref.read(adminProvider.notifier).loadMemberships,
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: memberships.length + 1,
        itemBuilder: (context, index) {
          if (index == 0) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: Column(
                children: [
                  TextField(
                    onChanged: (value) =>
                        ref.read(_adminPremiumQueryProvider.notifier).state = value,
                    decoration: const InputDecoration(
                      prefixIcon: Icon(Icons.search),
                      hintText: 'Search member, email, plan or status',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SingleChildScrollView(
                    scrollDirection: Axis.horizontal,
                    child: Row(
                      children: [
                        for (final filter in const [
                          ('ALL', 'All'),
                          ('ACTIVE', 'Active'),
                          ('PENDING', 'Pending'),
                          ('EXPIRED', 'Expired'),
                          ('CANCELLED', 'Cancelled'),
                        ])
                          Padding(
                            padding: const EdgeInsets.only(right: 8),
                            child: ChoiceChip(
                              label: Text(filter.$2),
                              selected: statusFilter == filter.$1,
                              onSelected: (_) => ref
                                  .read(_adminPremiumStatusProvider.notifier)
                                  .state = filter.$1,
                            ),
                          ),
                      ],
                    ),
                  ),
                ],
              ),
            );
          }
          final membership = memberships[index - 1];
          final user = _section(membership, 'user');
          final plan = _section(membership, 'plan');
          final id = _text(membership, 'id');
          final status = _text(membership, 'status').toUpperCase();
          return Card(
            child: ListTile(
              leading: const CircleAvatar(
                child: Icon(Icons.workspace_premium_outlined),
              ),
              title: Text(_text(user, 'fullName')),
              subtitle: Text(
                '${_text(plan, 'name')} • ${_text(membership, 'status')}\n'
                'Ends ${_text(membership, 'endDate')}',
              ),
              isThreeLine: true,
              onTap: () => _showDetails(context, membership),
              trailing: PopupMenuButton<String>(
                tooltip: 'Manage membership',
                onSelected: (action) async {
                  if (action == 'details') {
                    await _showDetails(context, membership);
                    return;
                  }
                  final label = switch (action) {
                    'activate' => 'Activate membership?',
                    'renew' => 'Renew membership for another plan period?',
                    'expire' => 'Mark membership as expired?',
                    _ => 'Cancel membership?',
                  };
                  if (!await _confirm(context, label, 'Member: ${_text(user, 'fullName')}')) {
                    return;
                  }
                  if (!context.mounted) return;
                  await _runAction(
                    context,
                    () => ref
                        .read(adminProvider.notifier)
                        .updateMembershipStatus(id, action),
                    'Membership updated',
                  );
                },
                itemBuilder: (_) => [
                  if (status == 'PENDING' || status == 'EXPIRED')
                    const PopupMenuItem(
                      value: 'activate',
                      child: Text('Activate'),
                    ),
                  if (status == 'ACTIVE' || status == 'EXPIRED')
                    const PopupMenuItem(
                      value: 'renew',
                      child: Text('Renew'),
                    ),
                  if (status == 'ACTIVE')
                    const PopupMenuItem(
                      value: 'expire',
                      child: Text('Mark expired'),
                    ),
                  if (status == 'ACTIVE' || status == 'PENDING')
                    const PopupMenuItem(
                      value: 'cancel',
                      child: Text('Cancel membership'),
                    ),
                  const PopupMenuItem(
                    value: 'details',
                    child: Text('View details'),
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

class _SocialMediaView extends ConsumerStatefulWidget {
  const _SocialMediaView({this.loadSettingsOnStart = true});

  final bool loadSettingsOnStart;

  @override
  ConsumerState<_SocialMediaView> createState() => _SocialMediaViewState();
}

class _SocialMediaViewState extends ConsumerState<_SocialMediaView> {
  final Map<String, Map<String, dynamic>> _drafts = {};
  final Map<String, TextEditingController> _captions = {};
  final Map<String, TextEditingController> _titles = {};
  final Map<String, Set<String>> _selectedPlatforms = {};
  final Map<String, TextEditingController> _locations = {};
  Map<String, dynamic> _settings = const {};
  bool _settingsLoading = true;

  @override
  void initState() {
    super.initState();
    if (widget.loadSettingsOnStart) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (mounted) _loadSettings();
      });
    } else {
      _settingsLoading = false;
    }
  }

  @override
  void dispose() {
    for (final controller in _captions.values) controller.dispose();
    for (final controller in _titles.values) controller.dispose();
    for (final controller in _locations.values) controller.dispose();
    super.dispose();
  }

  Future<void> _loadSettings() async {
    try {
      final value = await ref.read(adminProvider.notifier).getSocialSettings();
      if (mounted) setState(() { _settings = value; _settingsLoading = false; });
    } catch (_) {
      if (mounted) setState(() => _settingsLoading = false);
    }
  }

  bool _enabled(String platform) => _settings['${platform.toLowerCase()}Enabled'] == true;

  Future<void> _generate(BuildContext context, String propertyId) async {
    try {
      final notifier = ref.read(adminProvider.notifier);
      final generated = await notifier.generateSocialMedia(propertyId, const []);
      if (!mounted) return;
      _captions[propertyId]?.dispose();
      _titles[propertyId]?.dispose();
      setState(() {
        _drafts[propertyId] = generated;
        _captions[propertyId] = TextEditingController(text: generated['caption']?.toString() ?? '');
        _titles[propertyId] = TextEditingController(text: generated['videoTitle']?.toString() ?? generated['title']?.toString() ?? '');
        _selectedPlatforms[propertyId] = {
          for (final p in const ['FACEBOOK', 'INSTAGRAM', 'YOUTUBE'])
            if (_enabled(p)) p,
        };
      });
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Draft reel generated. Review it before publishing.')));
      }
    } catch (error) {
      if (context.mounted) _showError(context, error);
    }
  }

  Future<void> _publishSelected(BuildContext context, String propertyId) async {
    final selected = _selectedPlatforms[propertyId] ?? {};
    if (selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select at least one configured platform.')));
      return;
    }
    final baseCaption = _captions[propertyId]?.text.trim() ?? '';
    final location = _locations[propertyId]?.text.trim() ?? '';
    final caption = location.isEmpty || baseCaption.contains(location)
        ? baseCaption
        : '$baseCaption\n📍 $location'.trim();
    final title = _titles[propertyId]?.text.trim();
    try {
      for (final platform in selected) {
        await ref.read(adminProvider.notifier).publishSocialMedia(
          propertyId,
          platform,
          caption: caption,
          title: title,
        );
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Submitted to ${selected.length} selected platform(s).')));
      }
    } catch (error) {
      if (context.mounted) _showError(context, error);
    }
  }

  Future<void> _scheduleSelected(BuildContext context, String propertyId) async {
    final selected = _selectedPlatforms[propertyId] ?? {};
    if (selected.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select at least one configured platform.')));
      return;
    }
    final now = DateTime.now();
    final date = await showDatePicker(context: context, firstDate: now, lastDate: now.add(const Duration(days: 365)), initialDate: now);
    if (date == null || !context.mounted) return;
    final time = await showTimePicker(context: context, initialTime: TimeOfDay.fromDateTime(now.add(const Duration(hours: 1))));
    if (time == null || !context.mounted) return;
    final scheduledAt = DateTime(date.year, date.month, date.day, time.hour, time.minute);
    if (!scheduledAt.isAfter(now)) {
      _showError(context, StateError('Choose a future date and time.'));
      return;
    }
    final baseCaption = _captions[propertyId]?.text.trim() ?? '';
    final location = _locations[propertyId]?.text.trim() ?? '';
    final caption = location.isEmpty || baseCaption.contains(location) ? baseCaption : '$baseCaption\n📍 $location'.trim();
    final title = _titles[propertyId]?.text.trim();
    try {
      for (final platform in selected) {
        await ref.read(adminProvider.notifier).scheduleSocialMedia(
          propertyId, platform, scheduledAt, caption: caption, title: title,
        );
      }
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Scheduled for ${selected.length} platform(s).')));
      }
    } catch (error) {
      if (context.mounted) _showError(context, error);
    }
  }

  Future<void> _showPublicationHistory(BuildContext context, String propertyId) async {
    final posts = ref.read(adminProvider).socialPosts.where((post) => _text(post, 'propertyId') == propertyId).toList();
    await showDialog<void>(
      context: context,
      builder: (historyContext) => AlertDialog(
        title: const Text('Publication history'),
        content: SizedBox(
          width: 620,
          height: 440,
          child: posts.isEmpty
              ? const Center(child: Text('No publication history yet.'))
              : ListView.builder(
                  itemCount: posts.length,
                  itemBuilder: (_, index) {
                    final post = posts[index];
                    final status = _text(post, 'status').toUpperCase();
                    return Card(child: ListTile(
                      title: Text('${_text(post,'platform')} • $status'),
                      subtitle: Text('Created: ${_text(post,'createdAt')}\n${_text(post,'error')}'),
                      isThreeLine: true,
                      onTap: () async {
                        final events = await ref.read(adminProvider.notifier).getSocialPostHistory(_text(post,'id'));
                        if (!historyContext.mounted) return;
                        await showDialog<void>(
                          context: historyContext,
                          builder: (_) => AlertDialog(
                            title: const Text('Audit history'),
                            content: SizedBox(
                              width: 520,
                              child: events.isEmpty
                                  ? const Text('No audit events.')
                                  : ListView(shrinkWrap: true, children: events.map((event) => ListTile(
                                      title: Text(_text(event,'eventType')),
                                      subtitle: Text(_text(event,'createdAt')),
                                    )).toList()),
                            ),
                            actions: [TextButton(onPressed: () => Navigator.pop(historyContext), child: const Text('Close'))],
                          ),
                        );
                      },
                      trailing: status == 'FAILED'
                          ? IconButton(
                              tooltip: 'Retry',
                              icon: const Icon(Icons.refresh),
                              onPressed: () => _runAction(historyContext, () => ref.read(adminProvider.notifier).retrySocialPost(_text(post,'id')), 'Retry submitted'),
                            )
                          : const SizedBox.shrink(),
                    ));
                  },
                ),
        ),
        actions: [
          TextButton(
            onPressed: () async {
              final cancellable = posts.where((p) => const {'PENDING','READY','FAILED'}.contains(_text(p,'status').toUpperCase())).toList();
              if (cancellable.isNotEmpty) {
                await _runAction(historyContext, () => ref.read(adminProvider.notifier).cancelSocialPost(_text(cancellable.first,'id')), 'Post cancelled');
              }
            },
            child: const Text('Cancel pending/failed'),
          ),
          TextButton(onPressed: () => Navigator.pop(historyContext), child: const Text('Close')),
        ],
      ),
    );
  }

  Widget _platform(String propertyId, String platform, String label) {
    final enabled = _enabled(platform);
    final selected = _selectedPlatforms[propertyId]?.contains(platform) ?? false;
    return CheckboxListTile(
      dense: true,
      contentPadding: EdgeInsets.zero,
      value: enabled && selected,
      onChanged: enabled ? (value) => setState(() {
        final set = _selectedPlatforms.putIfAbsent(propertyId, () => <String>{});
        if (value == true) set.add(platform); else set.remove(platform);
      }) : null,
      title: Text(label),
      subtitle: Text(enabled ? 'Configured and ready' : 'Integration not configured'),
    );
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(adminProvider);
    final notifier = ref.read(adminProvider.notifier);
    final consentedProperties = state.socialProperties.where((property) =>
      _section(property, 'socialMarketingConsent')['approved'] == true).toList();

    return _AdminRefreshView(
      error: state.error,
      empty: consentedProperties.isEmpty,
      onRefresh: () async { await notifier.loadSocialMedia(); await _loadSettings(); },
      child: consentedProperties.isEmpty
        ? ListView(children: const [SizedBox(height:160), Center(child:Icon(Icons.campaign_outlined,size:56)), SizedBox(height:12), Center(child:Text('No social-media consented properties yet.'))])
        : ListView.builder(
            padding: const EdgeInsets.all(12),
            itemCount: consentedProperties.length,
            itemBuilder: (context,index) {
              final property=consentedProperties[index];
              final consent=_section(property,'socialMarketingConsent');
              final owner=_section(property,'owner');
              final id=_text(property,'id');
              final preparedVideoUrl = consent['preparedVideoUrl']?.toString() ?? '';
              final draft = _drafts[id] ?? (preparedVideoUrl.isNotEmpty ? <String, dynamic>{
                'videoUrl': preparedVideoUrl,
                'caption': consent['preparedCaption']?.toString() ?? '',
                'videoTitle': consent['preparedTitle']?.toString() ?? _text(property, 'title'),
              } : null);
              return Card(child:ListTile(
                title:Text(_text(property,'title'),style:const TextStyle(fontWeight:FontWeight.bold)),
                subtitle:Text('Consent active • Owner: ${_text(owner,'fullName')}\nConsent version: ${_text(consent,'consentVersion')}'),
                isThreeLine:true,
                trailing:const Icon(Icons.chevron_right),
                onTap:()=>_showSocialPropertyDialog(context, property, id, draft),
              ));
            },
          ),
    );
  }
  Future<void> _showSocialPropertyDialog(
    BuildContext context,
    Map<String, dynamic> property,
    String id,
    Map<String, dynamic>? initialDraft,
  ) async {
    _locations.putIfAbsent(id, () => TextEditingController(
      text: [_text(property, 'locality'), _text(property, 'city')]
          .where((value) => value.isNotEmpty)
          .join(', '),
    ));
    if (initialDraft != null) {
      _captions.putIfAbsent(id, () => TextEditingController(text: initialDraft['caption']?.toString() ?? ''));
      _titles.putIfAbsent(id, () => TextEditingController(text: initialDraft['videoTitle']?.toString() ?? _text(property, 'title')));
      _selectedPlatforms.putIfAbsent(id, () => {
        for (final p in const ['FACEBOOK', 'INSTAGRAM', 'YOUTUBE']) if (_enabled(p)) p,
      });
    }
    await showDialog<void>(
      context: context,
      builder: (dialogContext) => StatefulBuilder(
        builder: (dialogContext, setDialogState) {
          final draft = _drafts[id] ?? initialDraft;
          final videoUrl = draft?['videoUrl']?.toString() ?? '';
          return AlertDialog(
            title: Text(_text(property, 'title')),
            content: SizedBox(
              width: 520,
              child: SingleChildScrollView(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  TextField(controller: _locations[id], decoration: const InputDecoration(labelText: 'Location', border: OutlineInputBorder())),
                  const SizedBox(height: 12),
                  FilledButton.icon(
                    onPressed: () async { await _generate(dialogContext, id); if (dialogContext.mounted) setDialogState(() {}); },
                    icon: const Icon(Icons.auto_awesome),
                    label: Text(draft == null ? 'Generate reel' : 'Regenerate reel'),
                  ),
                  if (draft != null) ...[
                    const SizedBox(height: 16),
                    if (videoUrl.isNotEmpty) ListTile(
                      contentPadding: EdgeInsets.zero,
                      leading: const Icon(Icons.play_circle_outline),
                      title: const Text('View generated reel'),
                      subtitle: Text(videoUrl, maxLines: 2, overflow: TextOverflow.ellipsis),
                      onTap: () => launchUrl(Uri.parse(videoUrl), mode: LaunchMode.externalApplication),
                    ),
                    TextField(controller: _titles[id], decoration: const InputDecoration(labelText: 'Video title', border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    TextField(controller: _captions[id], minLines: 5, maxLines: 10, decoration: const InputDecoration(labelText: 'Caption / description', alignLabelWithHint: true, border: OutlineInputBorder())),
                    const SizedBox(height: 12),
                    Text('Publish to', style: Theme.of(dialogContext).textTheme.titleMedium),
                    if (_settingsLoading) const LinearProgressIndicator(),
                    _platform(id, 'FACEBOOK', 'Facebook'),
                    _platform(id, 'INSTAGRAM', 'Instagram'),
                    _platform(id, 'YOUTUBE', 'YouTube'),
                    const SizedBox(height: 8),
                    FilledButton.icon(
                      onPressed: () => _publishSelected(dialogContext, id),
                      icon: const Icon(Icons.publish_outlined),
                      label: const Text('Publish selected platforms'),
                    ),
                    const SizedBox(height: 8),
                    OutlinedButton.icon(
                      onPressed: () => _scheduleSelected(dialogContext, id),
                      icon: const Icon(Icons.schedule_outlined),
                      label: const Text('Schedule selected platforms'),
                    ),
                    const SizedBox(height: 8),
                    TextButton.icon(
                      onPressed: () => _showPublicationHistory(dialogContext, id),
                      icon: const Icon(Icons.history),
                      label: const Text('Publication history'),
                    ),
                  ],
                ]),
              ),
            ),
            actions: [TextButton(onPressed: () => Navigator.of(dialogContext).pop(), child: const Text('Close'))],
          );
        },
      ),
    );
  }

}

class _BillingView extends ConsumerWidget {
  const _BillingView();

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(adminProvider);
    final notifier = ref.read(adminProvider.notifier);
    final overview = state.billingOverview;
    return _AdminRefreshView(
      error: state.error,
      empty: overview.isEmpty,
      onRefresh: notifier.loadBilling,
      child: DefaultTabController(
        length: 5,
        child: Column(children: [
          Padding(
            padding: const EdgeInsets.all(12),
            child: Wrap(spacing: 8, runSpacing: 8, children: [
              _AdminStatCard(label: 'Revenue', value: '₹${overview['revenue'] ?? 0}', icon: Icons.currency_rupee),
              _AdminStatCard(label: 'Memberships', value: '${overview['memberships'] ?? 0}', icon: Icons.workspace_premium_outlined),
              _AdminStatCard(label: 'Payments', value: '${overview['payments'] ?? 0}', icon: Icons.payments_outlined),
              _AdminStatCard(label: 'Invoices', value: '${overview['invoices'] ?? 0}', icon: Icons.receipt_long_outlined),
            ]),
          ),
          const TabBar(isScrollable: true, tabs: [
            Tab(text: 'Plans'), Tab(text: 'Memberships'), Tab(text: 'Premium listings'),
            Tab(text: 'Payments'), Tab(text: 'Invoices'),
          ]),
          Expanded(child: TabBarView(children: [
            _billingList(state.billingPlans, (item) => ListTile(
              title: Text(_text(item, 'name')),
              subtitle: Text('${_text(item, 'code')} • ₹${item['price'] ?? 0} • ${_number(item, 'durationDays')} days'),
              trailing: Chip(label: Text(item['isActive'] == true ? 'Active' : 'Inactive')),
            )),
            _billingList(state.memberships, (item) {
              final user = _section(item, 'user');
              final plan = _section(item, 'plan');
              return ListTile(
                title: Text(_text(user, 'fullName')),
                subtitle: Text('${_text(plan, 'name')} • ${_text(item, 'status')}\n${_text(user, 'email')}'),
                isThreeLine: true,
                trailing: PopupMenuButton<String>(
                  onSelected: (action) async {
                    if (action == 'extend') {
                      await _runAction(context, () => notifier.extendMembership(_text(item, 'id'), 30), 'Membership extended 30 days');
                    } else if (action == 'restore') {
                      await _runAction(context, () => notifier.restoreMembership(_text(item, 'id')), 'Membership restored');
                    } else {
                      await _runAction(context, () => notifier.updateMembershipStatus(_text(item, 'id'), action), 'Membership updated');
                    }
                  },
                  itemBuilder: (_) => const [
                    PopupMenuItem(value:'activate', child:Text('Activate')),
                    PopupMenuItem(value:'renew', child:Text('Renew')),
                    PopupMenuItem(value:'extend', child:Text('Extend 30 days')),
                    PopupMenuItem(value:'restore', child:Text('Restore')),
                    PopupMenuItem(value:'expire', child:Text('Expire')),
                    PopupMenuItem(value:'cancel', child:Text('Cancel')),
                  ],
                ),
              );
            }),
            _billingList(state.premiumListings, (item) {
              final property = _section(item, 'property');
              return ListTile(
                title: Text(_text(property, 'title')),
                subtitle: Text('${_text(item, 'status')} • ₹${item['amount'] ?? 0}'),
                trailing: PopupMenuButton<String>(
                  onSelected: (action) => _runAction(context, () => notifier.updatePremiumListingStatus(_text(item,'id'), action), 'Premium listing updated'),
                  itemBuilder: (_) => const [
                    PopupMenuItem(value:'activate',child:Text('Activate')),
                    PopupMenuItem(value:'expire',child:Text('Expire')),
                    PopupMenuItem(value:'cancel',child:Text('Cancel')),
                  ],
                ),
              );
            }),
            _billingList(state.payments, (item) => ListTile(
              title: Text('₹${item['amount'] ?? 0} ${_text(item,'currency')}'),
              subtitle: Text('${_text(item,'status')} • ${_text(item,'razorpayPaymentId')}'),
              trailing: Text(_text(item, 'createdAt')),
            )),
            _billingList(state.invoices, (item) {
              final user = _section(item, 'user');
              return ListTile(
                title: Text(_text(item, 'invoiceNumber')),
                subtitle: Text('${_text(user,'fullName')} • ₹${item['totalAmount'] ?? 0} • ${_text(item,'status')}'),
                trailing: PopupMenuButton<String>(
                  onSelected: (action) => _runAction(context, () => notifier.updateInvoiceStatus(_text(item,'id'), action), 'Invoice updated'),
                  itemBuilder: (_) => const [
                    PopupMenuItem(value:'paid',child:Text('Mark paid')),
                    PopupMenuItem(value:'cancel',child:Text('Cancel')),
                  ],
                ),
              );
            }),
          ])),
        ]),
      ),
    );
  }

  Widget _billingList(List<Map<String,dynamic>> items, Widget Function(Map<String,dynamic>) builder) =>
      items.isEmpty
          ? const Center(child: Text('No records found.'))
          : ListView.separated(
              padding: const EdgeInsets.all(12),
              itemCount: items.length,
              separatorBuilder: (_, _) => const Divider(height:1),
              itemBuilder: (_,i) => Card(child: builder(items[i])),
            );
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
                            itemBuilder: (_) {
                              if (status == 'PENDING') {
                                return const [
                                  PopupMenuItem(
                                    value: 'approve',
                                    child: Text('Approve'),
                                  ),
                                  PopupMenuItem(
                                    value: 'reject',
                                    child: Text('Reject'),
                                  ),
                                ];
                              }
                              if (status == 'APPROVED') {
                                return const [
                                  PopupMenuItem(
                                    value: 'complete',
                                    child: Text('Complete'),
                                  ),
                                  PopupMenuItem(
                                    value: 'reject',
                                    child: Text('Reject'),
                                  ),
                                ];
                              }
                              return const <PopupMenuEntry<String>>[];
                            },
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
    final social = state.socialAnalytics;

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
          _AnalyticsSection(
            title: 'Social Media',
            values: {
              'Total posts': _number(social, 'totalPosts'),
              'Published': _number(social, 'published'),
              'Pending': _number(social, 'pending'),
              'Failed': _number(social, 'failed'),
              'Instagram': _number(social, 'instagram'),
              'Facebook': _number(social, 'facebook'),
              'YouTube': _number(social, 'youtube'),
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
  const _MetricCard(this.label, this.value, this.icon, {this.onTap});

  final String label;
  final int value;
  final IconData icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: Theme.of(context).colorScheme.primary),
              const SizedBox(height: 8),
              Text('$value', style: Theme.of(context).textTheme.headlineMedium),
              Text(label, textAlign: TextAlign.center),
            ],
          ),
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
    await _showDetails(context, 'User Details', {
      'Name': _text(user, 'fullName'),
      'Email': _text(user, 'email'),
      'Phone': _text(user, 'phone'),
      'Role': _text(user, 'role'),
      'Status': user['isActive'] == true ? 'Active' : 'Inactive',
      'Properties': '${_number(user, 'totalProperties')}',
      'Created': _text(user, 'createdAt'),
    });
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
    final images = property['images'] is List
        ? List<Map<String, dynamic>>.from(
            (property['images'] as List).whereType<Map>().map(
                  (item) => Map<String, dynamic>.from(item),
                ),
          )
        : <Map<String, dynamic>>[];
    final amenities = property['amenities'] is List
        ? (property['amenities'] as List)
            .map((item) => item is Map ? _section(Map<String, dynamic>.from(item), 'amenity') : const <String, dynamic>{})
            .map((item) => _text(item, 'name'))
            .where((name) => name.isNotEmpty)
            .join(', ')
        : '';
    await showModalBottomSheet<void>(
      context: context,
      showDragHandle: true,
      isScrollControlled: true,
      builder: (sheetContext) => SafeArea(
        child: FractionallySizedBox(
          heightFactor: 0.92,
          child: ListView(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 24),
            children: [
              Text('Property approval review',
                  style: Theme.of(sheetContext).textTheme.headlineSmall),
              const SizedBox(height: 12),
              if (images.isNotEmpty) ...[
                SizedBox(
                  height: 220,
                  child: ListView.separated(
                    scrollDirection: Axis.horizontal,
                    itemCount: images.length,
                    separatorBuilder: (_, _) => const SizedBox(width: 10),
                    itemBuilder: (_, index) => ClipRRect(
                      borderRadius: BorderRadius.circular(12),
                      child: Image.network(
                        _text(images[index], 'imageUrl'),
                        width: 300,
                        fit: BoxFit.cover,
                        errorBuilder: (_, _, _) =>
                            const SizedBox(width: 300, child: Icon(Icons.broken_image_outlined)),
                      ),
                    ),
                  ),
                ),
                const SizedBox(height: 16),
              ],
              if (_text(property, 'videoUrl').isNotEmpty)
                ListTile(
                  contentPadding: EdgeInsets.zero,
                  leading: const Icon(Icons.videocam_outlined),
                  title: const Text('Video tour attached'),
                  subtitle: SelectableText(_text(property, 'videoUrl')),
                ),
              ...{
                'Title': _text(property, 'title'),
                'Description': _text(property, 'description'),
                'Property type': _text(property, 'propertyType'),
                'Monthly rent': '₹${_text(property, 'price')}',
                'Security deposit': '₹${_text(property, 'securityDeposit')}',
                'Bedrooms': _text(property, 'bedrooms'),
                'Bathrooms': _text(property, 'bathrooms'),
                'Area': '${_text(property, 'area')} sq ft',
                'Furnishing': _text(property, 'furnishing'),
                'Address': _text(property, 'address'),
                'Locality': _text(property, 'locality'),
                'Landmark': _text(property, 'landmark'),
                'City': _text(property, 'city'),
                'State': _text(property, 'state'),
                'Country': _text(property, 'country'),
                'Pincode': _text(property, 'pincode'),
                'Amenities': amenities,
                'Parking': property['parking'] == true ? 'Yes' : 'No',
                'Pet friendly': property['petFriendly'] == true ? 'Yes' : 'No',
                'Owner': _text(owner, 'fullName'),
                'Owner email': _text(owner, 'email'),
                'Owner phone': _text(owner, 'phone'),
                'Approval': property['isVerified'] == true ? 'Approved' : 'Pending approval',
              }.entries.map((entry) => ListTile(
                    contentPadding: EdgeInsets.zero,
                    title: Text(entry.key),
                    subtitle: Text(entry.value.isEmpty ? '—' : entry.value),
                  )),
            ],
          ),
        ),
      ),
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
