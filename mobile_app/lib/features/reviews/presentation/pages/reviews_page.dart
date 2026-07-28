import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers/review_provider.dart';
import '../widgets/add_review_dialog.dart';
import '../widgets/rating_bar_widget.dart';
import '../widgets/review_card.dart';

class ReviewsPage extends ConsumerStatefulWidget {
  final String propertyId;

  const ReviewsPage({
    super.key,
    required this.propertyId,
  });

  @override
  ConsumerState<ReviewsPage> createState() =>
      _ReviewsPageState();
}

class _ReviewsPageState
    extends ConsumerState<ReviewsPage> {
  @override
  void initState() {
    super.initState();

    Future.microtask(() {
      ref
          .read(reviewProvider.notifier)
          .loadReviews(widget.propertyId);
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = ref.watch(reviewProvider);

    final reviews = state.reviews;

    final averageRating = reviews.isEmpty
        ? 0.0
        : reviews
                .map((e) => e.rating)
                .reduce((a, b) => a + b) /
            reviews.length;

    return Scaffold(
      appBar: AppBar(
        title: const Text(
          'Reviews',
        ),
      ),

      floatingActionButton:
          FloatingActionButton.extended(
        onPressed: () {
          showDialog(
            context: context,
            builder: (_) => AddReviewDialog(
              onSubmit: (
                rating,
                comment,
              ) async {
                await ref
                    .read(
                      reviewProvider.notifier,
                    )
                    .addReview(
                      propertyId:
                          widget.propertyId,
                      rating: rating,
                      comment: comment,
                    );
              },
            ),
          );
        },
        icon: const Icon(Icons.rate_review),
        label: const Text(
          'Write Review',
        ),
      ),

      body: state.isLoading
          ? const Center(
              child:
                  CircularProgressIndicator(),
            )
          : reviews.isEmpty
              ? const Center(
                  child: Text(
                    'No reviews yet.',
                  ),
                )
              : Column(
                  children: [

                    Container(
                      width: double.infinity,
                      padding:
                          const EdgeInsets.all(20),
                      color:
                          Colors.grey.shade100,
                      child: Column(
                        children: [

                          Text(
                            averageRating
                                .toStringAsFixed(1),
                            style:
                                const TextStyle(
                              fontSize: 42,
                              fontWeight:
                                  FontWeight.bold,
                            ),
                          ),

                          const SizedBox(
                            height: 8,
                          ),

                          RatingBarWidget(
                            rating:
                                averageRating,
                            size: 28,
                          ),

                          const SizedBox(
                            height: 8,
                          ),

                          Text(
                            '${reviews.length} Reviews',
                            style:
                                const TextStyle(
                              fontSize: 16,
                            ),
                          ),
                        ],
                      ),
                    ),

                    Expanded(
                      child: ListView.builder(
                        padding:
                            const EdgeInsets.all(
                          16,
                        ),
                        itemCount:
                            reviews.length,
                        itemBuilder:
                            (context, index) {
                          final review =
                              reviews[index];

                          return ReviewCard(
                            review: review,

                            onEdit: () {
                              showDialog(
                                context:
                                    context,
                                builder: (_) =>
                                    AddReviewDialog(
                                  initialRating:
                                      review.rating,
                                  initialComment:
                                      review.comment,
                                  onSubmit: (
                                    rating,
                                    comment,
                                  ) async {
                                    await ref
                                        .read(
                                          reviewProvider
                                              .notifier,
                                        )
                                        .updateReview(
                                          reviewId:
                                              review.id,
                                          propertyId:
                                              widget.propertyId,
                                          rating:
                                              rating,
                                          comment:
                                              comment,
                                        );
                                  },
                                ),
                              );
                            },

                            onDelete: () async {
                              final confirm =
                                  await showDialog<bool>(
                                context:
                                    context,
                                builder:
                                    (context) =>
                                        AlertDialog(
                                  title:
                                      const Text(
                                    'Delete Review',
                                  ),
                                  content:
                                      const Text(
                                    'Are you sure you want to delete this review?',
                                  ),
                                  actions: [

                                    TextButton(
                                      onPressed:
                                          () =>
                                              Navigator.pop(
                                        context,
                                        false,
                                      ),
                                      child:
                                          const Text(
                                        'Cancel',
                                      ),
                                    ),

                                    ElevatedButton(
                                      onPressed:
                                          () =>
                                              Navigator.pop(
                                        context,
                                        true,
                                      ),
                                      child:
                                          const Text(
                                        'Delete',
                                      ),
                                    ),
                                  ],
                                ),
                              );

                              if (confirm ==
                                  true) {
                                await ref
                                    .read(
                                      reviewProvider
                                          .notifier,
                                    )
                                    .deleteReview(
                                      reviewId:
                                          review.id,
                                      propertyId:
                                          widget.propertyId,
                                    );
                              }
                            },
                          );
                        },
                      ),
                    ),
                  ],
                ),
    );
  }
}