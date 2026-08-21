$p = "lib/features/property/data/models/property_model.dart"

$s = [System.IO.File]::ReadAllText($p)

$old = @"
      imageUrls:
          (json['imageUrls'] as List<dynamic>?)
              ?.map((e) => e.toString())
              .toList() ??
          const [],
"@

$new = @"
      imageUrls: _parseImageUrls(json),
"@

if (-not $s.Contains($old)) {
    Write-Host "ERROR: Original imageUrls block not found"
    exit 1
}

$s = $s.Replace($old, $new)

$marker = "  factory PropertyModel.fromJson(Map<String, dynamic> json) {"

$helper = @"
  static List<String> _parseImageUrls(Map<String, dynamic> json) {
    final imageUrls = json['imageUrls'];

    if (imageUrls is List) {
      return imageUrls
          .map((e) => e.toString().trim())
          .where((url) => url.isNotEmpty)
          .toList();
    }

    final images = json['images'];

    if (images is List) {
      return images
          .whereType<Map>()
          .map((image) => image['imageUrl']?.toString().trim() ?? '')
          .where((url) => url.isNotEmpty)
          .toList();
    }

    final imageUrl = json['imageUrl']?.toString().trim();

    if (imageUrl != null && imageUrl.isNotEmpty) {
      return [imageUrl];
    }

    return const [];
  }

"@

if ($s.Contains("_parseImageUrls")) {
    Write-Host "ERROR: Parser helper already exists"
    exit 1
}

if (-not $s.Contains($marker)) {
    Write-Host "ERROR: fromJson marker not found"
    exit 1
}

$s = $s.Replace($marker, $helper + $marker)

[System.IO.File]::WriteAllText($p, $s)

Write-Host "SUCCESS: PropertyModel updated"
