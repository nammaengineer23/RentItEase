import 'package:dio/dio.dart';

import '../models/review_model.dart';

class ReviewApi {
  ReviewApi(this.dio);

  final Dio dio;

  // ==========================================================
  // Get Reviews for Property
  // ==========================================================

  Future<List<ReviewModel>> getReviews(String propertyId) async {
    final response = await dio.get('/reviews/$propertyId');

    final responseData = response.data;

    if (responseData is! Map<String, dynamic>) {
      throw Exception('Invalid reviews response from server.');
    }

    final data = responseData['data'];

    if (data is! List) {
      throw Exception('Invalid reviews data from server.');
    }

    return data
        .whereType<Map<String, dynamic>>()
        .map(ReviewModel.fromJson)
        .toList();
  }

  // ==========================================================
  // Get Review Statistics
  // ==========================================================

  Future<ReviewStats> getStats(String propertyId) async {
    final response = await dio.get('/reviews/$propertyId/stats');

    final responseData = response.data;

    if (responseData is! Map<String, dynamic>) {
      throw Exception('Invalid review statistics response from server.');
    }

    return ReviewStats.fromJson(responseData);
  }

  // ==========================================================
  // Add / Update Review
  // ==========================================================

  Future<ReviewModel> addReview({
    required String propertyId,
    required int rating,
    String? comment,
  }) async {
    final response = await dio.post(
      '/reviews/$propertyId',
      data: {'rating': rating, 'comment': comment},
    );

    final responseData = response.data;

    if (responseData is! Map<String, dynamic>) {
      throw Exception('Invalid review response from server.');
    }

    final review = responseData['review'];

    if (review is! Map<String, dynamic>) {
      throw Exception('Review data missing from server response.');
    }

    return ReviewModel.fromJson(review);
  }

  // ==========================================================
  // Update Review
  // ==========================================================

  Future<ReviewModel> updateReview({
    required String reviewId,
    required int rating,
    String? comment,
  }) async {
    final response = await dio.patch(
      '/reviews/$reviewId',
      data: {'rating': rating, 'comment': comment},
    );

    final responseData = response.data;

    if (responseData is! Map<String, dynamic>) {
      throw Exception('Invalid review response from server.');
    }

    final review = responseData['review'];

    if (review is! Map<String, dynamic>) {
      throw Exception('Review data missing from server response.');
    }

    return ReviewModel.fromJson(review);
  }

  // ==========================================================
  // Delete Review
  // ==========================================================

  Future<void> deleteReview(String reviewId) async {
    await dio.delete('/reviews/$reviewId');
  }
}

// ============================================================
// Review Statistics
// ============================================================

class ReviewStats {
  const ReviewStats({
    required this.averageRating,
    required this.totalReviews,
    required this.ratings,
  });

  final double averageRating;
  final int totalReviews;
  final Map<int, int> ratings;

  factory ReviewStats.fromJson(Map<String, dynamic> json) {
    final rawRatings = json['ratings'];

    final ratings = <int, int>{1: 0, 2: 0, 3: 0, 4: 0, 5: 0};

    if (rawRatings is Map) {
      for (final entry in rawRatings.entries) {
        final key = int.tryParse(entry.key.toString());

        if (key != null && ratings.containsKey(key)) {
          final value = entry.value;

          if (value is num) {
            ratings[key] = value.toInt();
          } else {
            ratings[key] = int.tryParse(value.toString()) ?? 0;
          }
        }
      }
    }

    return ReviewStats(
      averageRating: _parseDouble(json['averageRating']),
      totalReviews: _parseInt(json['totalReviews']),
      ratings: ratings,
    );
  }

  static double _parseDouble(dynamic value) {
    if (value is num) {
      return value.toDouble();
    }

    return double.tryParse(value?.toString() ?? '') ?? 0.0;
  }

  static int _parseInt(dynamic value) {
    if (value is num) {
      return value.toInt();
    }

    return int.tryParse(value?.toString() ?? '') ?? 0;
  }
}
