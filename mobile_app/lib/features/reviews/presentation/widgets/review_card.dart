import 'package:flutter/material.dart';

import '../../models/review_model.dart';
import 'rating_bar_widget.dart';

class ReviewCard extends StatelessWidget {
  final ReviewModel review;

  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  const ReviewCard({
    super.key,
    required this.review,
    this.onEdit,
    this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundImage:
                      review.userPhoto != null && review.userPhoto!.isNotEmpty
                      ? NetworkImage(review.userPhoto!)
                      : null,
                  child: review.userPhoto == null || review.userPhoto!.isEmpty
                      ? Text(
                          review.userName.isNotEmpty
                              ? review.userName.substring(0, 1).toUpperCase()
                              : '?',
                        )
                      : null,
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        review.userName,
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 4),

                      RatingBarWidget(rating: review.rating, size: 18),
                    ],
                  ),
                ),

                PopupMenuButton<String>(
                  onSelected: (value) {
                    if (value == 'edit') {
                      onEdit?.call();
                    }

                    if (value == 'delete') {
                      onDelete?.call();
                    }
                  },
                  itemBuilder: (context) => const [
                    PopupMenuItem(value: 'edit', child: Text('Edit')),

                    PopupMenuItem(value: 'delete', child: Text('Delete')),
                  ],
                ),
              ],
            ),

            const SizedBox(height: 16),

            Text(
              review.comment,
              style: TextStyle(color: Colors.grey.shade700, height: 1.5),
            ),

            const SizedBox(height: 16),

            Align(
              alignment: Alignment.centerRight,
              child: Text(
                _formatDate(review.createdAt),
                style: TextStyle(color: Colors.grey.shade600, fontSize: 12),
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _formatDate(DateTime date) {
    return '${date.day}/${date.month}/${date.year}';
  }
}
