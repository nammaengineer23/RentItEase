import 'package:flutter/material.dart';

class AppResponsive {
  static const double mobileBreakpoint = 600;
  static const double desktopBreakpoint = 1200;
  static const double wideContentWidth = 1200;

  static bool isMobile(BuildContext context) =>
      MediaQuery.sizeOf(context).width < mobileBreakpoint;
  static bool isTablet(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    return width >= mobileBreakpoint && width < desktopBreakpoint;
  }
  static bool isDesktop(BuildContext context) =>
      MediaQuery.sizeOf(context).width >= desktopBreakpoint;

  static int columns(BuildContext context, {int mobile = 1, int tablet = 2, int desktop = 3}) {
    if (isDesktop(context)) return desktop;
    if (isTablet(context)) return tablet;
    return mobile;
  }

  static EdgeInsets pagePadding(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    if (width >= desktopBreakpoint) return const EdgeInsets.symmetric(horizontal: 32, vertical: 24);
    if (width >= mobileBreakpoint) return const EdgeInsets.symmetric(horizontal: 24, vertical: 20);
    return const EdgeInsets.all(16);
  }

  static double maxContentWidth(BuildContext context) {
    final width = MediaQuery.sizeOf(context).width;
    final horizontal = pagePadding(context).horizontal;
    return (width - horizontal).clamp(0, wideContentWidth).toDouble();
  }

  static Widget constrain(BuildContext context, Widget child, {double maxWidth = wideContentWidth}) =>
      Align(
        alignment: Alignment.topCenter,
        child: ConstrainedBox(
          constraints: BoxConstraints(maxWidth: maxWidth),
          child: child,
        ),
      );
}

class AdaptivePage extends StatelessWidget {
  const AdaptivePage({super.key, required this.child, this.maxWidth = AppResponsive.wideContentWidth});
  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) => SafeArea(
    top: false,
    child: AppResponsive.constrain(
      context,
      Padding(padding: AppResponsive.pagePadding(context), child: child),
      maxWidth: maxWidth,
    ),
  );
}
