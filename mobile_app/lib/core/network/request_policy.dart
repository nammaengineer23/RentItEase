class RequestPolicy {
  const RequestPolicy._();

  static bool canRetryAfterRefresh(String method) {
    switch (method.toUpperCase()) {
      case 'GET':
      case 'HEAD':
      case 'OPTIONS':
        return true;
      default:
        return false;
    }
  }
}
