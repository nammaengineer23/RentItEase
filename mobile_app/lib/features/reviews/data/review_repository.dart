import '../models/review_model.dart';
import 'review_api.dart';

class ReviewRepository {
  final ReviewApi api;

  ReviewRepository(this.api);

  // ==========================================
  // Get Reviews
  // ==========================================

  Future<List<ReviewModel>> getReviews(String propertyId) async {
    return await api.getReviews(propertyId);
  }

  // ==========================================
  // Add Review
  // ==========================================

  Future<ReviewModel> addReview({
    required String propertyId,
    required double rating,
    required String comment,
  }) async {
    return await api.addReview(
      propertyId: propertyId,
      rating: rating,
      comment: comment,
    );
  }

  // ==========================================
  // Update Review
  // ==========================================

  Future<ReviewModel> updateReview({
    required String reviewId,
    required double rating,
    required String comment,
  }) async {
    return await api.updateReview(
      reviewId: reviewId,
      rating: rating,
      comment: comment,
    );
  }

  // ==========================================
  // Delete Review
  // ==========================================

  Future<void> deleteReview(String reviewId) async {
    await api.deleteReview(reviewId);
  }
}
