import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/network/dio_provider.dart';
import '../data/review_api.dart';
import '../data/review_repository.dart';
import '../models/review_model.dart';

// ==========================================================
// Repository Provider
// ==========================================================
//
// Use the existing application-wide dioProvider.
// Do NOT create another Dio instance here.
//

final reviewRepositoryProvider = Provider<ReviewRepository>((ref) {
  final dio = ref.watch(dioProvider);

  return ReviewRepository(ReviewApi(dio));
});

// ==========================================================
// Review State
// ==========================================================

class ReviewState {
  const ReviewState({
    this.isLoading = false,
    this.reviews = const [],
    this.stats,
    this.error,
  });

  final bool isLoading;
  final List<ReviewModel> reviews;
  final ReviewStats? stats;
  final String? error;

  ReviewState copyWith({
    bool? isLoading,
    List<ReviewModel>? reviews,
    ReviewStats? stats,
    String? error,
    bool clearStats = false,
  }) {
    return ReviewState(
      isLoading: isLoading ?? this.isLoading,
      reviews: reviews ?? this.reviews,
      stats: clearStats ? null : stats ?? this.stats,
      error: error,
    );
  }
}

// ==========================================================
// Review Notifier
// ==========================================================

class ReviewNotifier extends StateNotifier<ReviewState> {
  ReviewNotifier(this.repository) : super(const ReviewState());

  final ReviewRepository repository;

  // ========================================================
  // Load Reviews
  // ========================================================

  Future<void> loadReviews(String propertyId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final reviews = await repository.getReviews(propertyId);

      state = state.copyWith(isLoading: false, reviews: reviews, error: null);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ========================================================
  // Load Review Statistics
  // ========================================================

  Future<void> loadStats(String propertyId) async {
    try {
      final stats = await repository.getStats(propertyId);

      state = state.copyWith(stats: stats, error: null);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  // ========================================================
  // Load Reviews + Statistics
  // ========================================================

  Future<void> loadReviewsAndStats(String propertyId) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      final results = await Future.wait([
        repository.getReviews(propertyId),
        repository.getStats(propertyId),
      ]);

      final reviews = results[0] as List<ReviewModel>;
      final stats = results[1] as ReviewStats;

      state = state.copyWith(
        isLoading: false,
        reviews: reviews,
        stats: stats,
        error: null,
      );
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ========================================================
  // Add Review
  // ========================================================

  Future<void> addReview({
    required String propertyId,
    required int rating,
    String? comment,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await repository.addReview(
        propertyId: propertyId,
        rating: rating,
        comment: comment,
      );

      await loadReviewsAndStats(propertyId);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ========================================================
  // Update Review
  // ========================================================

  Future<void> updateReview({
    required String reviewId,
    required String propertyId,
    required int rating,
    String? comment,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await repository.updateReview(
        reviewId: reviewId,
        rating: rating,
        comment: comment,
      );

      await loadReviewsAndStats(propertyId);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ========================================================
  // Delete Review
  // ========================================================

  Future<void> deleteReview({
    required String reviewId,
    required String propertyId,
  }) async {
    state = state.copyWith(isLoading: true, error: null);

    try {
      await repository.deleteReview(reviewId);

      await loadReviewsAndStats(propertyId);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: e.toString());
    }
  }

  // ========================================================
  // Clear Error
  // ========================================================

  void clearError() {
    state = state.copyWith(error: null);
  }
}

// ==========================================================
// Provider
// ==========================================================

final reviewProvider = StateNotifierProvider<ReviewNotifier, ReviewState>((
  ref,
) {
  final repository = ref.watch(reviewRepositoryProvider);

  return ReviewNotifier(repository);
});
