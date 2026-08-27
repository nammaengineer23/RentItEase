dynamic unwrapResponseData(dynamic responseData) {
  var current = responseData;

  while (current is Map && current['data'] != null) {
    current = current['data'];
  }

  return current;
}

Map<String, dynamic> unwrapResponseMap(dynamic responseData) {
  final value = unwrapResponseData(responseData);

  if (value is! Map) {
    throw const FormatException('Expected an object response.');
  }

  return Map<String, dynamic>.from(value);
}

List<dynamic> unwrapResponseList(
  dynamic responseData, {
  List<String> keys = const [],
}) {
  var value = responseData;

  while (value is Map) {
    for (final key in keys) {
      if (value[key] is List) {
        return List<dynamic>.from(value[key] as List);
      }
    }

    if (value['data'] != null) {
      value = value['data'];
      continue;
    }

    break;
  }

  if (value is List) {
    return List<dynamic>.from(value);
  }

  throw const FormatException('Expected a list response.');
}
