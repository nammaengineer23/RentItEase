import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

class PropertyYoutubeReel extends StatefulWidget {
  const PropertyYoutubeReel({super.key, required this.youtubeUrl});

  final String youtubeUrl;

  @override
  State<PropertyYoutubeReel> createState() => _PropertyYoutubeReelState();
}

class _PropertyYoutubeReelState extends State<PropertyYoutubeReel> {
  YoutubePlayerController? _controller;

  @override
  void initState() {
    super.initState();
    _configure();
  }

  void _configure() {
    final videoId = YoutubePlayerController.convertUrlToId(widget.youtubeUrl);
    if (videoId == null || videoId.isEmpty) return;
    _controller = YoutubePlayerController.fromVideoId(
      videoId: videoId,
      autoPlay: false,
      params: const YoutubePlayerParams(
        showControls: true,
        showFullscreenButton: true,
        enableCaption: true,
        strictRelatedVideos: true,
      ),
    );
  }

  @override
  void didUpdateWidget(covariant PropertyYoutubeReel oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.youtubeUrl != widget.youtubeUrl) {
      _controller?.close();
      _controller = null;
      _configure();
      setState(() {});
    }
  }

  @override
  void dispose() {
    _controller?.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;
    if (controller == null) {
      return OutlinedButton.icon(
        onPressed: () => launchUrl(
          Uri.parse(widget.youtubeUrl),
          mode: LaunchMode.externalApplication,
        ),
        icon: const Icon(Icons.smart_display_outlined),
        label: const Text('Watch this property reel on YouTube'),
      );
    }

    final screenHeight = MediaQuery.sizeOf(context).height;
    final reelHeight = (screenHeight * 0.72).clamp(480.0, 760.0);

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          'RentItEase YouTube Reel',
          style: Theme.of(context).textTheme.titleLarge,
        ),
        const SizedBox(height: 12),
        Center(
          child: ConstrainedBox(
            constraints: BoxConstraints(
              maxWidth: reelHeight * 9 / 16,
              maxHeight: reelHeight,
            ),
            child: ClipRRect(
              borderRadius: BorderRadius.circular(18),
              child: AspectRatio(
                aspectRatio: 9 / 16,
                child: YoutubePlayer(
                  controller: controller,
                  aspectRatio: 9 / 16,
                ),
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        Text(
          'Tap play to watch the complete published reel. Full-screen playback is available from the player controls.',
          style: Theme.of(context).textTheme.bodySmall,
        ),
      ],
    );
  }
}
