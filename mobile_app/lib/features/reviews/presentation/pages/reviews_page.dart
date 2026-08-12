import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../data/review_api.dart';
import '../../providers/review_provider.dart';
import '../widgets/add_review_dialog.dart';
import '../widgets/rating_bar_widget.dart';
import '../widgets/review_card.dart';

class ReviewsPage extends ConsumerStatefulWidget {
  const ReviewsPage({super.key, required this.propertyId});

  final String propertyId;

  @override
  ConsumerState<ReviewsPage> createState() => _ReviewsPageState();
}

class _ReviewsPageState extends ConsumerState<ReviewsPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref.read(reviewProvider.notifier).loadReviewsAndStats(widget.propertyId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reviewProvider);
    final reviews = state.reviews;
    final stats = state.stats;

    return Scaffold(
      appBar: AppBar(title: const Text('Reviews')),

      // ======================================================
      // Write Review
      // ======================================================
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () {
          _showAddReviewDialog(context);
        },
        icon: const Icon(Icons.rate_review),
        label: const Text('Write Review'),
      ),

      // ======================================================
      // Body
      // ======================================================
      body: state.isLoading && reviews.isEmpty
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () {
                return ref
                    .read(reviewProvider.notifier)
                    .loadReviewsAndStats(widget.propertyId);
              },
              child: reviews.isEmpty
                  ? ListView(
                      physics: const AlwaysScrollableScrollPhysics(),
                      children: const [
                        SizedBox(height: 180),
                        Center(
                          child: Text(
                            'No reviews yet.',
                            style: TextStyle(fontSize: 16),
                          ),
                        ),
                      ],
                    )
                  : Column(
                      children: [
                        // ====================================
                        // Rating Summary
                        // ====================================
                        _buildRatingSummary(stats, reviews.length),

                        // ====================================
                        // Reviews
                        // ====================================
                        Expanded(
                          child: ListView.builder(
                            padding: const EdgeInsets.all(16),
                            itemCount: reviews.length,
                            itemBuilder: (context, index) {
                              final review = reviews[index];

                              return ReviewCard(
                                review: review,

                                onEdit: () {
                                  _showEditReviewDialog(context, review);
                                },

                                onDelete: () {
                                  _confirmDeleteReview(context, review.id);
                                },
                              );
                            },
                          ),
                        ),
                      ],
                    ),
            ),
    );
  }

  // ==========================================================
  // Rating Summary
  // ==========================================================

  Widget _buildRatingSummary(ReviewStats? stats, int fallbackCount) {
    final averageRating = stats?.averageRating ?? 0.0;

    final totalReviews = stats?.totalReviews ?? fallbackCount;

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(20),
      color: Colors.grey.shade100,
      child: Column(
        children: [
          Text(
            averageRating.toStringAsFixed(1),
            style: const TextStyle(fontSize: 42, fontWeight: FontWeight.bold),
          ),

          const SizedBox(height: 8),

          RatingBarWidget(rating: averageRating.round(), size: 28),

          const SizedBox(height: 8),

          Text('$totalReviews Reviews', style: const TextStyle(fontSize: 16)),

          if (stats != null) ...[
            const SizedBox(height: 16),
            _buildRatingBreakdown(stats),
          ],
        ],
      ),
    );
  }

  // ==========================================================
  // Rating Breakdown
  // ==========================================================

  Widget _buildRatingBreakdown(ReviewStats stats) {
    return Column(
      children: [
        _ratingRow(5, stats.ratings[5] ?? 0),
        _ratingRow(4, stats.ratings[4] ?? 0),
        _ratingRow(3, stats.ratings[3] ?? 0),
        _ratingRow(2, stats.ratings[2] ?? 0),
        _ratingRow(1, stats.ratings[1] ?? 0),
      ],
    );
  }

  Widget _ratingRow(int rating, int count) {
    final total = ref.read(reviewProvider).stats?.totalReviews ?? 0;

    final percentage = total == 0 ? 0.0 : count / total;

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 3),
      child: Row(
        children: [
          SizedBox(
            width: 24,
            child: Text('$rating', textAlign: TextAlign.right),
          ),

          const SizedBox(width: 4),

          const Icon(Icons.star, size: 16, color: Colors.amber),

          const SizedBox(width: 8),

          Expanded(
            child: ClipRRect(
              borderRadius: BorderRadius.circular(4),
              child: LinearProgressIndicator(
                value: percentage,
                minHeight: 7,
                backgroundColor: Colors.grey.shade300,
                valueColor: const AlwaysStoppedAnimation<Color>(Colors.amber),
              ),
            ),
          ),

          const SizedBox(width: 8),

          SizedBox(
            width: 30,
            child: Text(
              '$count',
              textAlign: TextAlign.right,
              style: TextStyle(color: Colors.grey.shade700, fontSize: 12),
            ),
          ),
        ],
      ),
    );
  }

  // ==========================================================
  // Add Review Dialog
  // ==========================================================

  void _showAddReviewDialog(BuildContext context) {
    showDialog(
      context: context,
      builder: (_) {
        return AddReviewDialog(
          onSubmit: (rating, comment) async {
            await ref
                .read(reviewProvider.notifier)
                .addReview(
                  propertyId: widget.propertyId,
                  rating: rating,
                  comment: comment,
                );
          },
        );
      },
    );
  }

  // ==========================================================
  // Edit Review Dialog
  // ==========================================================

  void _showEditReviewDialog(BuildContext context, review) {
    showDialog(
      context: context,
      builder: (_) {
        return AddReviewDialog(
          initialRating: review.rating,
          initialComment: review.comment ?? '',
          onSubmit: (rating, comment) async {
            await ref
                .read(reviewProvider.notifier)
                .updateReview(
                  reviewId: review.id,
                  propertyId: widget.propertyId,
                  rating: rating,
                  comment: comment,
                );
          },
        );
      },
    );
  }

  // ==========================================================
  // Delete Review Confirmation
  // ==========================================================

  Future<void> _confirmDeleteReview(
    BuildContext context,
    String reviewId,
  ) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (dialogContext) {
        return AlertDialog(
          title: const Text('Delete Review'),
          content: const Text('Are you sure you want to delete this review?'),
          actions: [
            TextButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(false);
              },
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                Navigator.of(dialogContext).pop(true);
              },
              child: const Text('Delete'),
            ),
          ],
        );
      },
    );

    if (confirm != true) {
      return;
    }

    if (!mounted) {
      return;
    }

    await ref
        .read(reviewProvider.notifier)
        .deleteReview(reviewId: reviewId, propertyId: widget.propertyId);
  }
}
