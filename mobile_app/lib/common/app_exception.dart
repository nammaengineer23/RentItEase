class AppException implements Exception {
  const AppException(this.message);

  final String message;

  @override
  String toString() => message;
}

class ApiException extends AppException {
  const ApiException(super.message, {this.statusCode});

  final int? statusCode;
}
