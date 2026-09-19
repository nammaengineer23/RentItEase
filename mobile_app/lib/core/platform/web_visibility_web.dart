// ignore: deprecated_member_use
import 'dart:html' as html;

import 'package:flutter/foundation.dart';

VoidCallback listenForWebVisibilityChanges({
  required VoidCallback onHidden,
  required VoidCallback onVisible,
}) {
  void listener(html.Event _) {
    if (html.document.hidden == true) {
      onHidden();
    } else {
      onVisible();
    }
  }

  html.document.addEventListener('visibilitychange', listener);
  return () => html.document.removeEventListener('visibilitychange', listener);
}
