import 'package:flutter/material.dart';

class CategoryGrid extends StatelessWidget {
  const CategoryGrid({super.key});

  @override
  Widget build(BuildContext context) {
    final categories = const [
      _CategoryData(
        title: 'Apartment',
        icon: Icons.apartment_rounded,
        color: Colors.blue,
      ),
      _CategoryData(
        title: 'House',
        icon: Icons.house_rounded,
        color: Colors.green,
      ),
      _CategoryData(
        title: 'Villa',
        icon: Icons.villa_rounded,
        color: Colors.orange,
      ),
      _CategoryData(
        title: 'PG',
        icon: Icons.hotel_rounded,
        color: Colors.purple,
      ),
      _CategoryData(
        title: 'Hostel',
        icon: Icons.meeting_room_rounded,
        color: Colors.red,
      ),
      _CategoryData(
        title: 'Office',
        icon: Icons.business_center_rounded,
        color: Colors.teal,
      ),
    ];

    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16),
      child: GridView.builder(
        shrinkWrap: true,
        physics: const NeverScrollableScrollPhysics(),
        itemCount: categories.length,
        gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
          crossAxisCount: 3,
          crossAxisSpacing: 14,
          mainAxisSpacing: 14,
          childAspectRatio: 1,
        ),
        itemBuilder: (context, index) {
          final category = categories[index];

          return InkWell(
            borderRadius: BorderRadius.circular(18),
            onTap: () {
              // TODO: Navigate / Filter by category
            },
            child: Container(
              decoration: BoxDecoration(
                color: category.color.withValues(alpha: 0.08),
                borderRadius: BorderRadius.circular(18),
                border: Border.all(
                  color: category.color.withValues(alpha: 0.25),
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircleAvatar(
                    radius: 26,
                    backgroundColor: category.color.withValues(alpha: 0.15),
                    child: Icon(category.icon, color: category.color, size: 28),
                  ),
                  const SizedBox(height: 12),
                  Text(
                    category.title,
                    textAlign: TextAlign.center,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 14,
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

class _CategoryData {
  final String title;
  final IconData icon;
  final Color color;

  const _CategoryData({
    required this.title,
    required this.icon,
    required this.color,
  });
}
