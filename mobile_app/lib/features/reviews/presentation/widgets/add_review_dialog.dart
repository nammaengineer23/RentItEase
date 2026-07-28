import 'package:flutter/material.dart';

class AddReviewDialog extends StatefulWidget {
  final double initialRating;
  final String initialComment;
  final Function(
    double rating,
    String comment,
  ) onSubmit;

  const AddReviewDialog({
    super.key,
    this.initialRating = 5,
    this.initialComment = '',
    required this.onSubmit,
  });

  @override
  State<AddReviewDialog> createState() =>
      _AddReviewDialogState();
}

class _AddReviewDialogState
    extends State<AddReviewDialog> {
  late double _rating;

  late TextEditingController
      _commentController;

  @override
  void initState() {
    super.initState();

    _rating = widget.initialRating;

    _commentController =
        TextEditingController(
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
    return AlertDialog(
      title: Text(
        widget.initialComment.isEmpty
            ? 'Write Review'
            : 'Edit Review',
      ),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize:
              MainAxisSize.min,
          children: [

            const Text(
              'Rate this property',
              style: TextStyle(
                fontWeight:
                    FontWeight.bold,
              ),
            ),

            const SizedBox(height: 16),

            Row(
              mainAxisAlignment:
                  MainAxisAlignment.center,
              children: List.generate(
                5,
                (index) {
                  return IconButton(
                    icon: Icon(
                      index < _rating
                          ? Icons.star
                          : Icons.star_border,
                      color:
                          Colors.amber,
                      size: 34,
                    ),
                    onPressed: () {
                      setState(() {
                        _rating =
                            index + 1.0;
                      });
                    },
                  );
                },
              ),
            ),

            const SizedBox(height: 20),

            TextField(
              controller:
                  _commentController,
              maxLines: 4,
              decoration:
                  const InputDecoration(
                labelText: 'Review',
                hintText:
                    'Share your experience...',
                border:
                    OutlineInputBorder(),
              ),
            ),
          ],
        ),
      ),
      actions: [

        TextButton(
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text(
            'Cancel',
          ),
        ),

        ElevatedButton(
          onPressed: () {
            if (_commentController.text
                .trim()
                .isEmpty) {
              ScaffoldMessenger.of(
                context,
              ).showSnackBar(
                const SnackBar(
                  content: Text(
                    'Please enter a review.',
                  ),
                ),
              );
              return;
            }

            widget.onSubmit(
              _rating,
              _commentController.text
                  .trim(),
            );

            Navigator.pop(context);
          },
          child: Text(
            widget.initialComment
                    .isEmpty
                ? 'Submit'
                : 'Update',
          ),
        ),
      ],
    );
  }
}