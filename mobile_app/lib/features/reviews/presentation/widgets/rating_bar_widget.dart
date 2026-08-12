import 'package:flutter/material.dart';

class RatingBarWidget extends StatelessWidget {
  const RatingBarWidget({
    super.key,
    required this.rating,
    this.size = 22,
    this.filledColor,
    this.emptyColor,
  });

  final int rating;
  final double size;
  final Color? filledColor;
  final Color? emptyColor;

  @override
  Widget build(BuildContext context) {
    final fill = filledColor ?? Colors.amber;
    final empty = emptyColor ?? Colors.grey.shade300;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final star = index + 1;

        return Icon(
          star <= rating ? Icons.star : Icons.star_border,
          color: star <= rating ? fill : empty,
          size: size,
        );
      }),
    );
  }
}
