import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';

class PropertyVideoTour extends StatefulWidget {
  const PropertyVideoTour({
    super.key,
    required this.videoUrl,
  });

  final String videoUrl;

  @override
  State<PropertyVideoTour> createState() => _PropertyVideoTourState();
}

class _PropertyVideoTourState extends State<PropertyVideoTour> {
  bool _opening = false;

  Future<void> _openVideo() async {
    if (_opening) return;
    final uri = Uri.tryParse(widget.videoUrl);
    if (uri == null || !uri.hasScheme) {
      _showError();
      return;
    }

    setState(() => _opening = true);
    try {
      if (!await launchUrl(uri, mode: LaunchMode.platformDefault)) {
        _showError();
      }
    } catch (_) {
      _showError();
    } finally {
      if (mounted) setState(() => _opening = false);
    }
  }

  void _showError() {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('The video tour could not be opened. Please try again.'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final colors = Theme.of(context).colorScheme;
    return Semantics(
      button: true,
      label: 'Play property video tour',
      child: InkWell(
        onTap: _opening ? null : _openVideo,
        borderRadius: BorderRadius.circular(16),
        child: Ink(
          height: 190,
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(16),
            gradient: LinearGradient(
              colors: [
                colors.primaryContainer,
                colors.primary.withValues(alpha: 0.78),
              ],
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
          ),
          child: Center(
            child: _opening
                ? const CircularProgressIndicator()
                : Column(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.play_circle_fill,
                        size: 72,
                        color: colors.onPrimary,
                      ),
                      const SizedBox(height: 10),
                      Text(
                        'Play video tour',
                        style: Theme.of(context).textTheme.titleMedium?.copyWith(
                              color: colors.onPrimary,
                              fontWeight: FontWeight.bold,
                            ),
                      ),
                    ],
                  ),
          ),
        ),
      ),
    );
  }
}
