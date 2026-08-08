import 'package:flutter/material.dart';

class AddReviewDialog extends StatefulWidget {
  const AddReviewDialog({
    super.key,
    this.initialRating = 5,
    this.initialComment = '',
    required this.onSubmit,
  });

  final int initialRating;
  final String initialComment;
  final void Function(int rating, String? comment) onSubmit;

  @override
  State<AddReviewDialog> createState() =>
      _AddReviewDialogState();
}

class _AddReviewDialogState
    extends State<AddReviewDialog> {
  late int _rating;
  late TextEditingController _commentController;

  @override
  void initState() {
    super.initState();

    _rating = widget.initialRating.clamp(1, 5);

    _commentController = TextEditingController(
      text: widget.initialComment,
    );
  }

  @override
  void dispose() {
    _commentController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isEditing = widget.initialComment.isNotEmpty;

    return AlertDialog(
      title: Text(
        isEditing ? 'Edit Review' : 'Write Review',
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text(
              'Rate this property',
              style: TextStyle(
                fontWeight: FontWeight.bold,
              ),
            ),

            const SizedBox(height: 16),

            // ==================================================
            // Rating
            // ==================================================

            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: List.generate(5, (index) {
                final star = index + 1;

                return IconButton(
                  tooltip: '$star star',
                  icon: Icon(
                    star <= _rating
                        ? Icons.star
                        : Icons.star_border,
                    color: Colors.amber,
                    size: 34,
                  ),
                  onPressed: () {
                    setState(() {
                      _rating = star;
                    });
                  },
                );
              }),
            ),

            const SizedBox(height: 8),

            Text(
              '$_rating / 5',
              style: const TextStyle(
                fontWeight: FontWeight.w600,
              ),
            ),

            const SizedBox(height: 20),

            // ==================================================
            // Comment
            // ==================================================

            TextField(
              controller: _commentController,
              maxLines: 4,
              maxLength: 1000,
              textInputAction: TextInputAction.newline,
              decoration: const InputDecoration(
                labelText: 'Review',
                hintText: 'Share your experience...',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: () {
            Navigator.of(context).pop();
          },
          child: const Text('Cancel'),
        ),

        ElevatedButton(
          onPressed: () {
            final comment =
                _commentController.text.trim();

            widget.onSubmit(
              _rating,
              comment.isEmpty ? null : comment,
            );

            Navigator.of(context).pop();
          },
          child: Text(
            isEditing ? 'Update' : 'Submit',
          ),
        ),
      ],
    );
  }
}