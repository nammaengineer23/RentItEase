import 'dart:ui';

import 'package:flutter/material.dart';

/// Gives the web build the same direct touch-drag scrolling expected on a
/// phone, while retaining mouse and trackpad scrolling on desktop browsers.
class AppScrollBehavior extends MaterialScrollBehavior {
  const AppScrollBehavior();

  @override
  Set<PointerDeviceKind> get dragDevices => const {
    PointerDeviceKind.touch,
    PointerDeviceKind.mouse,
    PointerDeviceKind.trackpad,
    PointerDeviceKind.stylus,
  };
}
