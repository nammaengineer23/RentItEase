import 'package:flutter/material.dart';

import '../../models/review_model.dart';
import 'rating_bar_widget.dart';

class ReviewCard extends StatelessWidget {
  const ReviewCard({
    super.key,
    required this.review,
    this.onEdit,
    this.onDelete,
  });

  final ReviewModel review;

  final VoidCallback? onEdit;
  final VoidCallback? onDelete;

  @override
  Widget build(BuildContext context) {
    final hasPhoto =
        review.userPhoto != null &&
        review.userPhoto!.trim().isNotEmpty;

    final hasComment =
        review.comment != null &&
        review.comment!.trim().isNotEmpty;

    final initial = review.userName.trim().isNotEmpty
        ? review.userName.trim().substring(0, 1).toUpperCase()
        : '?';

    return Card(
      margin: const EdgeInsets.only(bottom: 16),
      elevation: 2,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(14),
      ),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // ==================================================
            // User Information
            // ==================================================

            Row(
              children: [
                CircleAvatar(
                  radius: 24,
                  backgroundImage: hasPhoto
                      ? NetworkImage(review.userPhoto!)
                      : null,
                  child: hasPhoto
                      ? null
                      : Text(
                          initial,
                          style: const TextStyle(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                ),

                const SizedBox(width: 12),

                Expanded(
                  child: Column(
                    crossAxisAlignment:
                        CrossAxisAlignment.start,
                    children: [
                      Text(
                        review.userName.isNotEmpty
                            ? review.userName
                            : 'Anonymous User',
                        style: const TextStyle(
                          fontSize: 16,
                          fontWeight: FontWeight.bold,
                        ),
                      ),

                      const SizedBox(height: 4),

                      RatingBarWidget(
                        rating: review.rating,
                        size: 18,
                      ),
                    ],
                  ),
                ),

                // ==================================================
                // Actions
                // ==================================================

                if (onEdit != null || onDelete != null)
                  PopupMenuButton<String>(
                    onSelected: (value) {
                      switch (value) {
                        case 'edit':
                          onEdit?.call();
                          break;

                        case 'delete':
                          onDelete?.call();
                          break;
                      }
                    },
                    itemBuilder: (context) => [
                      if (onEdit != null)
                        const PopupMenuItem<String>(
                          value: 'edit',
                          child: Text('Edit'),
                        ),
                      if (onDelete != null)
                        const PopupMenuItem<String>(
                          value: 'delete',
                          child: Text('Delete'),
                        ),
                    ],
                  ),
              ],
            ),

            const SizedBox(height: 16),

            // ==================================================
            // Comment
            // ==================================================

            if (hasComment)
              Text(
                review.comment!,
                style: TextStyle(
                  color: Colors.grey.shade700,
                  height: 1.5,
                ),
              )
            else
              Text(
                'No comment provided.',
                style: TextStyle(
                  color: Colors.grey.shade500,
                  fontStyle: FontStyle.italic,
                ),
              ),

            const SizedBox(height: 16),

            // ==================================================
            // Date
            // ==================================================

            Align(
              alignment: Alignment.centerRight,
              child: Text(
                _formatDate(review.createdAt),
                style: TextStyle(
                  color: Colors.grey.shade600,
                  fontSize: 12,
                ),
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