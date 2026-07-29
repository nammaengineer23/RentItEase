class RegisterRequest {
  final String fullName;
  final String email;
  final String phone;
  final String password;

  const RegisterRequest({
    required this.fullName,
    required this.email,
    required this.phone,
    required this.password,
  });

  Map<String, dynamic> toJson() {
    return {
      'fullName': fullName,
      'email': email,
      'phone': phone,
      'password': password,
    };
  }

  factory RegisterRequest.fromJson(Map<String, dynamic> json) {
    return RegisterRequest(
      fullName: json['fullName'] as String,
      email: json['email'] as String,
      phone: json['phone'] as String,
      password: json['password'] as String,
    );
  }

  RegisterRequest copyWith({
    String? fullName,
    String? email,
    String? phone,
    String? password,
  }) {
    return RegisterRequest(
      fullName: fullName ?? this.fullName,
      email: email ?? this.email,
      phone: phone ?? this.phone,
      password: password ?? this.password,
    );
  }

  @override
  String toString() {
    return 'RegisterRequest(fullName: $fullName, email: $email, phone: $phone)';
  }
}
