import 'package:flutter/material.dart';

class RatingBarWidget extends StatelessWidget {
  final double rating;
  final double size;
  final Color? filledColor;
  final Color? emptyColor;

  const RatingBarWidget({
    super.key,
    required this.rating,
    this.size = 22,
    this.filledColor,
    this.emptyColor,
  });

  @override
  Widget build(BuildContext context) {
    final fill = filledColor ?? Colors.amber;

    final empty = emptyColor ?? Colors.grey.shade300;

    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(5, (index) {
        final star = index + 1;

        if (rating >= star) {
          return Icon(Icons.star, color: fill, size: size);
        }

        if (rating >= star - 0.5) {
          return Icon(Icons.star_half, color: fill, size: size);
        }

        return Icon(Icons.star_border, color: empty, size: size);
      }),
    );
  }
}
