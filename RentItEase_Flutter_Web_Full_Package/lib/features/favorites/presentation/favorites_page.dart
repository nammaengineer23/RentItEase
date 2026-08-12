import 'package:flutter/material.dart';

import '../../../shared/widgets/empty_state.dart';
import '../../../shared/widgets/page_container.dart';

class FavoritesPage extends StatelessWidget {
  const FavoritesPage({super.key});

  @override
  Widget build(BuildContext context) {
    return const PageContainer(
      title: 'Favorites',
      child: EmptyState(
        title: 'No favorites yet',
        message: 'Properties you save will appear here.',
        icon: Icons.favorite_border,
      ),
    );
  }
}
