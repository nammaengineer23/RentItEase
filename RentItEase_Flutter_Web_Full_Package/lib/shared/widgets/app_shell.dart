import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

class AppShell extends StatelessWidget {
  const AppShell({
    super.key,
    required this.location,
    required this.child,
  });

  final String location;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final desktop = constraints.maxWidth >= 900;

        if (desktop) {
          return Scaffold(
            body: Row(
              children: [
                _Sidebar(location: location),
                Expanded(child: child),
              ],
            ),
          );
        }

        return Scaffold(
          appBar: AppBar(
            title: const Text('RentItEase'),
          ),
          body: child,
          bottomNavigationBar: NavigationBar(
            selectedIndex: _index(location),
            onDestinationSelected: (index) {
              context.go(_routes[index]);
            },
            destinations: const [
              NavigationDestination(icon: Icon(Icons.home_outlined), selectedIcon: Icon(Icons.home), label: 'Home'),
              NavigationDestination(icon: Icon(Icons.search), label: 'Properties'),
              NavigationDestination(icon: Icon(Icons.favorite_border), selectedIcon: Icon(Icons.favorite), label: 'Favorites'),
              NavigationDestination(icon: Icon(Icons.event_outlined), selectedIcon: Icon(Icons.event), label: 'Visits'),
              NavigationDestination(icon: Icon(Icons.person_outline), selectedIcon: Icon(Icons.person), label: 'Profile'),
            ],
          ),
        );
      },
    );
  }

  static const _routes = [
    '/dashboard',
    '/properties',
    '/favorites',
    '/visits',
    '/profile',
  ];

  static int _index(String location) {
    if (location.startsWith('/properties')) return 1;
    if (location.startsWith('/favorites')) return 2;
    if (location.startsWith('/visits')) return 3;
    if (location.startsWith('/profile')) return 4;
    return 0;
  }
}

class _Sidebar extends StatelessWidget {
  const _Sidebar({required this.location});

  final String location;

  @override
  Widget build(BuildContext context) {
    return Container(
      width: 250,
      color: Colors.white,
      child: SafeArea(
        child: Column(
          children: [
            const Padding(
              padding: EdgeInsets.all(24),
              child: Align(
                alignment: Alignment.centerLeft,
                child: Text(
                  'RentItEase',
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.bold),
                ),
              ),
            ),
            Expanded(
              child: ListView(
                children: [
                  _item(context, Icons.dashboard_outlined, 'Dashboard', '/dashboard'),
                  _item(context, Icons.search, 'Properties', '/properties'),
                  _item(context, Icons.favorite_border, 'Favorites', '/favorites'),
                  _item(context, Icons.event_outlined, 'Visits', '/visits'),
                  _item(context, Icons.home_work_outlined, 'Owner Dashboard', '/owner'),
                  _item(context, Icons.payment_outlined, 'Payments', '/payments'),
                  _item(context, Icons.person_outline, 'Profile', '/profile'),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _item(BuildContext context, IconData icon, String title, String route) {
    final selected = location == route || location.startsWith('$route/');
    return ListTile(
      selected: selected,
      leading: Icon(icon),
      title: Text(title),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      onTap: () => context.go(route),
    );
  }
}
