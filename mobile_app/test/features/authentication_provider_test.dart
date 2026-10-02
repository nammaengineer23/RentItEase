import 'package:flutter_test/flutter_test.dart';
import 'package:shared_preferences/shared_preferences.dart';

import 'package:mobile_app/features/authentication/data/models/auth_response.dart';
import 'package:mobile_app/features/authentication/data/models/login_request.dart';
import 'package:mobile_app/features/authentication/data/repositories/authentication_repository_impl.dart';
import 'package:mobile_app/features/authentication/providers/authentication_provider.dart';

void main() {
  setUp(() {
    SharedPreferences.setMockInitialValues({});
  });

  test('successful login stores session and clears previous error', () async {
    final provider = AuthenticationProvider(repository: _FakeAuthRepository());
    await Future<void>.delayed(Duration.zero);

    final success = await provider.login(
      email: 'owner@example.com',
      password: 'password',
    );

    expect(success, isTrue);
    expect(provider.isLoggedIn, isTrue);
    expect(provider.errorMessage, isNull);
    expect(provider.authResponse?.user.role, 'OWNER');

    provider.dispose();
  });

  test('failed login exposes a user-facing error and leaves session empty', () async {
    final provider = AuthenticationProvider(
      repository: _FakeAuthRepository(shouldFail: true),
    );
    await Future<void>.delayed(Duration.zero);

    final success = await provider.login(
      email: 'owner@example.com',
      password: 'wrong',
    );

    expect(success, isFalse);
    expect(provider.isLoggedIn, isFalse);
    expect(provider.errorMessage, contains('invalid credentials'));

    provider.dispose();
  });
}

class _FakeAuthRepository extends AuthenticationRepositoryImpl {
  _FakeAuthRepository({this.shouldFail = false});

  final bool shouldFail;

  @override
  Future<AuthResponse> login(LoginRequest request) async {
    if (shouldFail) {
      throw Exception('invalid credentials');
    }

    return const AuthResponse(
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
      user: UserModel(
        id: 'user-1',
        fullName: 'Owner User',
        email: 'owner@example.com',
        role: 'OWNER',
        isVerified: true,
        isActive: true,
      ),
    );
  }

  @override
  Future<void> saveSession(AuthResponse response) async {}
}
