import 'package:dio/dio.dart';

import '../models/review_model.dart';

class ReviewApi {
  final Dio dio;

  ReviewApi(this.dio);

  // ==========================================
  // Get Reviews for Property
  // ==========================================

  Future<List<ReviewModel>> getReviews(
    String propertyId,
  ) async {
    final response = await dio.get(
      '/reviews/property/$propertyId',
    );

    final data = response.data as List;

    return data
        .map(
          (e) => ReviewModel.fromJson(e),
        )
        .toList();
  }

  // ==========================================
  // Add Review
  // ==========================================

  Future<ReviewModel> addReview({
    required String propertyId,
    required double rating,
    required String comment,
  }) async {
    final response = await dio.post(
      '/reviews',
      data: {
        'propertyId': propertyId,
        'rating': rating,
        'comment': comment,
      },
    );

    return ReviewModel.fromJson(
      response.data,
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
    final response = await dio.patch(
      '/reviews/$reviewId',
      data: {
        'rating': rating,
        'comment': comment,
      },
    );

    return ReviewModel.fromJson(
      response.data,
    );
  }

  // ==========================================
  // Delete Review
  // ==========================================

  Future<void> deleteReview(
    String reviewId,
  ) async {
    await dio.delete(
      '/reviews/$reviewId',
    );
  }
}