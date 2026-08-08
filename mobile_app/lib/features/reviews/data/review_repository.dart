import '../models/review_model.dart';
import 'review_api.dart';

class ReviewRepository {
  ReviewRepository(this.api);

  final ReviewApi api;

  // ==========================================================
  // Get Reviews
  // ==========================================================

  Future<List<ReviewModel>> getReviews(
    String propertyId,
  ) async {
    return api.getReviews(propertyId);
  }

  // ==========================================================
  // Get Review Statistics
  // ==========================================================

  Future<ReviewStats> getStats(
    String propertyId,
  ) async {
    return api.getStats(propertyId);
  }

  // ==========================================================
  // Add / Update Review
  // ==========================================================

  Future<ReviewModel> addReview({
    required String propertyId,
    required int rating,
    String? comment,
  }) async {
    return api.addReview(
      propertyId: propertyId,
      rating: rating,
      comment: comment,
    );
  }

  // ==========================================================
  // Update Review
  // ==========================================================

  Future<ReviewModel> updateReview({
    required String reviewId,
    required int rating,
    String? comment,
  }) async {
    return api.updateReview(
      reviewId: reviewId,
      rating: rating,
      comment: comment,
    );
  }

  // ==========================================================
  // Delete Review
  // ==========================================================

  Future<void> deleteReview(
    String reviewId,
  ) async {
    await api.deleteReview(reviewId);
  }
}