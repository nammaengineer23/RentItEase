import 'package:flutter/material.dart';

class FavoriteButton extends StatefulWidget {
  final bool isFavorite;
  final VoidCallback? onPressed;
  final double size;

  const FavoriteButton({
    super.key,
    this.isFavorite = false,
    this.onPressed,
    this.size = 22,
  });

  @override
  State<FavoriteButton> createState() => _FavoriteButtonState();
}

class _FavoriteButtonState extends State<FavoriteButton>
    with SingleTickerProviderStateMixin {
  late bool _isFavorite;
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;

  @override
  void initState() {
    super.initState();

    _isFavorite = widget.isFavorite;

    _controller = AnimationController(
      duration: const Duration(milliseconds: 250),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1,
      end: 1.25,
    ).animate(CurvedAnimation(parent: _controller, curve: Curves.easeOut));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _toggleFavorite() {
    setState(() {
      _isFavorite = !_isFavorite;
    });

    _controller.forward().then((_) {
      _controller.reverse();
    });

    widget.onPressed?.call();
  }

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.white.withValues(alpha: 0.9),
      shape: const CircleBorder(),
      elevation: 3,
      child: InkWell(
        borderRadius: BorderRadius.circular(50),
        onTap: _toggleFavorite,
        child: Padding(
          padding: const EdgeInsets.all(8),
          child: ScaleTransition(
            scale: _scaleAnimation,
            child: Icon(
              _isFavorite ? Icons.favorite : Icons.favorite_border,
              color: _isFavorite ? Colors.red : Colors.grey.shade700,
              size: widget.size,
            ),
          ),
        ),
      ),
    );
  }
}
