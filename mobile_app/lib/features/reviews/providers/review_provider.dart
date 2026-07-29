import 'package:dio/dio.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../data/review_api.dart';
import '../data/review_repository.dart';
import '../models/review_model.dart';

// =============================================
// TODO:
// Replace this with your existing dioProvider.
// Remove this provider if you already have one.
// =============================================

final dioProvider = Provider<Dio>((ref) {
  return Dio(
    BaseOptions(
      baseUrl: 'http://localhost:3000/api/v1',
      headers: {'Content-Type': 'application/json'},
    ),
  );
});

// =============================================
// Repository Provider
// =============================================

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return ReviewRepository(ReviewApi(dio));
});

// =============================================
// Review State
// =============================================

class ReviewState {
  final bool isLoading;
  final List<ReviewModel> reviews;
  final String? error;

  const ReviewState({
    this.isLoading = false,
    this.reviews = const [],
    this.error,
  });

  ReviewState copyWith({
    bool? isLoading,
    List<ReviewModel>? reviews,
    String? error,
  }) {
    return ReviewState(
      isLoading: isLoading ?? this.isLoading,
      reviews: reviews ?? this.reviews,
      error: error,
    );
  }
}

// =============================================
// Review Notifier
// =============================================

class ReviewNotifier extends StateNotifier<ReviewState> {
  final ReviewRepository repository;

  ReviewNotifier(this.repository) : super(const ReviewState());

  // ===========================================
  // Load Reviews
  // ===========================================

  Future<void> loadReviews(String propertyId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final reviews = await repository.getReviews(propertyId);

      state = state.copyWith(isLoading: false, reviews: reviews);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ===========================================
  // Add Review
  // ===========================================

  Future<void> addReview({
    required String propertyId,
    required double rating,
    required String comment,
  }) async {
    await repository.addReview(
      propertyId: propertyId,
      rating: rating,
      comment: comment,
    );

    await loadReviews(propertyId);
  }

  // ===========================================
  // Update Review
  // ===========================================

  Future<void> updateReview({
    required String reviewId,
    required String propertyId,
    required double rating,
    required String comment,
  }) async {
    await repository.updateReview(
      reviewId: reviewId,
      rating: rating,
      comment: comment,
    );

    await loadReviews(propertyId);
  }

  // ===========================================
  // Delete Review
  // ===========================================

  Future<void> deleteReview({
    required String reviewId,
    required String propertyId,
  }) async {
    await repository.deleteReview(reviewId);

    await loadReviews(propertyId);
  }
}

// =============================================
// Provider
// =============================================

final reviewProvider = StateNotifierProvider<ReviewNotifier, ReviewState>((
  ref,
) {
  final repository = ref.watch(reviewRepositoryProvider);

  return ReviewNotifier(repository);
});
