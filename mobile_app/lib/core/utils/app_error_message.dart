String userFriendlyError(Object? error) {
  final text = (error ?? '').toString().toLowerCase();
  if (text.contains('network') ||
      text.contains('socket') ||
      text.contains('connection')) {
    return 'Unable to connect. Check your internet connection and try again.';
  }
  if (text.contains('unauthorized') ||
      text.contains('401') ||
      text.contains('token')) {
    return 'Your session has expired. Please sign in again.';
  }
  if (text.contains('timeout')) {
    return 'This is taking longer than expected. Please try again.';
  }
  if (text.contains('missing-client-identifier') ||
      text.contains('play integrity')) {
    return 'Phone verification is not available in this build. Please try email and password instead.';
  }
  return 'Something went wrong. Please try again.';
}
