import '../../config/environment.dart';

/// Converts backend-relative upload paths into URLs that work on every client.
///
/// The API returns local uploads as `/uploads/...`. Android can sometimes
/// resolve those during development, but Flutter web would otherwise request
/// them from the website origin instead of the API origin.
abstract final class AppImageUrl {
  static String resolve(dynamic value) {
    final url = value?.toString().trim() ?? '';
    if (url.isEmpty) {
      return '';
    }

    final parsed = Uri.tryParse(url);
    if (parsed != null && parsed.hasScheme) {
      return url;
    }

    final apiUri = Uri.parse(Environment.apiBaseUrl);
    final apiOrigin = Uri(
      scheme: apiUri.scheme,
      host: apiUri.host,
      port: apiUri.hasPort ? apiUri.port : null,
    ).toString();
    final uploadPath = url.startsWith('/') ? url : '/$url';

    return '$apiOrigin$uploadPath';
  }
}
