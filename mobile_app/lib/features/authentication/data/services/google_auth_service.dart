import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class GoogleAuthService {
  GoogleAuthService({FirebaseAuth? firebaseAuth, GoogleSignIn? googleSignIn})
    : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
      _googleSignIn = googleSignIn ?? GoogleSignIn();

  final FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;

  Future<User?> signInWithGoogle() async {
    try {
      final googleUser = await _googleSignIn.signIn();

      if (googleUser == null) {
        return null;
      }

      final googleAuth = await googleUser.authentication;

      final accessToken = googleAuth.accessToken;
      final idToken = googleAuth.idToken;

      if (accessToken == null || idToken == null) {
        throw StateError(
          'Google sign-in did not return credentials. Ensure Google Sign-In is enabled.',
        );
      }

      final credential = GoogleAuthProvider.credential(
        accessToken: accessToken,
        idToken: idToken,
      );

      final userCredential = await _firebaseAuth.signInWithCredential(
        credential,
      );

      return userCredential.user;
    } on FirebaseAuthException catch (error) {
      throw FirebaseAuthException(
        code: error.code,
        message: _mapFirebaseAuthException(error),
      );
    } on Exception catch (error) {
      if (error is StateError) {
        rethrow;
      }

      throw Exception('Google sign-in failed: ${error.toString()}');
    }
  }

  String _mapFirebaseAuthException(FirebaseAuthException error) {
    switch (error.code) {
      case 'invalid-credential':
        return 'The Google sign-in credentials are invalid.';

      case 'operation-not-allowed':
        return 'Google Sign-In is not enabled.';

      case 'network-request-failed':
        return 'Network error. Please try again.';

      case 'too-many-requests':
        return 'Too many requests. Please try later.';

      default:
        return error.message ?? 'Authentication failed.';
    }
  }
}
