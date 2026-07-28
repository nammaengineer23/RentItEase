import 'package:flutter/material.dart';

class UploadProgressWidget extends StatelessWidget {
  final bool isUploading;

  final double progress;

  final String? error;

  final VoidCallback? onRetry;

  const UploadProgressWidget({
    super.key,
    required this.isUploading,
    required this.progress,
    this.error,
    this.onRetry,
  });

  @override
  Widget build(BuildContext context) {
    if (!isUploading &&
        error == null &&
        progress == 0) {
      return const SizedBox.shrink();
    }

    if (error != null) {
      return Card(
        color: Colors.red.shade50,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius:
              BorderRadius.circular(14),
          side: BorderSide(
            color: Colors.red.shade200,
          ),
        ),
        child: Padding(
          padding:
              const EdgeInsets.all(16),
          child: Row(
            children: [

              Icon(
                Icons.error_outline,
                color: Colors.red.shade700,
              ),

              const SizedBox(width: 12),

              Expanded(
                child: Text(
                  error!,
                  style: TextStyle(
                    color: Colors.red.shade700,
                  ),
                ),
              ),

              if (onRetry != null)
                TextButton.icon(
                  onPressed: onRetry,
                  icon: const Icon(
                    Icons.refresh,
                  ),
                  label: const Text(
                    'Retry',
                  ),
                ),
            ],
          ),
        ),
      );
    }

    if (!isUploading &&
        progress >= 1) {
      return Card(
        color: Colors.green.shade50,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius:
              BorderRadius.circular(14),
          side: BorderSide(
            color: Colors.green.shade300,
          ),
        ),
        child: const Padding(
          padding: EdgeInsets.all(16),
          child: Row(
            children: [

              Icon(
                Icons.check_circle,
                color: Colors.green,
              ),

              SizedBox(width: 12),

              Expanded(
                child: Text(
                  'Images uploaded successfully.',
                ),
              ),
            ],
          ),
        ),
      );
    }

    return Card(
      elevation: 0,
      shape: RoundedRectangleBorder(
        borderRadius:
            BorderRadius.circular(14),
      ),
      child: Padding(
        padding:
            const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment:
              CrossAxisAlignment.start,
          children: [

            Row(
              children: [

                const SizedBox(
                  width: 22,
                  height: 22,
                  child:
                      CircularProgressIndicator(
                    strokeWidth: 2.5,
                  ),
                ),

                const SizedBox(width: 12),

                const Expanded(
                  child: Text(
                    'Uploading Images...',
                    style: TextStyle(
                      fontWeight:
                          FontWeight.bold,
                    ),
                  ),
                ),

                Text(
                  '${(progress * 100).toStringAsFixed(0)}%',
                  style: const TextStyle(
                    fontWeight:
                        FontWeight.bold,
                  ),
                ),
              ],
            ),

            const SizedBox(height: 16),

            ClipRRect(
              borderRadius:
                  BorderRadius.circular(12),
              child:
                  LinearProgressIndicator(
                value: progress,
                minHeight: 8,
              ),
            ),

            const SizedBox(height: 10),

            Text(
              progress >= 1
                  ? 'Finalizing upload...'
                  : 'Please wait while your images are uploaded.',
              style: TextStyle(
                color: Colors.grey.shade700,
                fontSize: 13,
              ),
            ),
          ],
        ),
      ),
    );
  }
}