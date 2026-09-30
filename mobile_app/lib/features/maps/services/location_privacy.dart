class LocationPrivacy {
  const LocationPrivacy._();

  /// Rounds a user/device coordinate before it is shared outside the device.
  /// Four decimal places is roughly 11 m at the equator.
  static double roundForSharing(double coordinate) {
    if (!coordinate.isFinite) {
      throw ArgumentError.value(coordinate, 'coordinate');
    }
    return double.parse(coordinate.toStringAsFixed(4));
  }
}
