import 'package:firebase_auth/firebase_auth.dart';
import 'package:google_sign_in/google_sign_in.dart';

class GoogleAuthService
{
  GoogleAuthService({
    FirebaseAuth? firebaseAuth,
 GoogleSignIn? googleSignIn,
  }) : _firebaseAuth = firebaseAuth ?? FirebaseAuth.instance,
_googleSignIn = googleSignIn ?? GoogleSignIn.instance
{
    _googleSignIn.initialize();
  }

  final FirebaseAuth _firebaseAuth;
  final GoogleSignIn _googleSignIn;

  Future<User?> signInWithGoogle() async
{
    try
{
      // Try silent sign in first
      GoogleSignInAccount? googleUser =
          await _googleSignIn.attemptLightweightAuthentication();

      // If not signed in, show Google account picker
     googleUser = googleUser ?? await _googleSignIn.authenticate();

      final googleAuth = googleUser.authentication;

final idToken = googleAuth.idToken;

if (idToken == null) 
{
  throw StateError('Google Sign-In did not return an ID Token.');
}

final credential = GoogleAuthProvider.credential(
  idToken: idToken,
);

final userCredential =
    await _firebaseAuth.signInWithCredential(credential);

return userCredential.user;
    } on FirebaseAuthException catch (e)
{
      throw FirebaseAuthException(
        code: e.code,
message: _mapFirebaseAuthException(e),
      );
    } catch (e)
{
      throw Exception('Google Sign-In failed: $e');
    }
  }

  Future<void> signOut() async
{
    await _googleSignIn.signOut();
    await _firebaseAuth.signOut();
  }

  String _mapFirebaseAuthException(FirebaseAuthException error) 
{
    switch (error.code)
{
      case 'invalid-credential':
        return 'The Google sign-in credentials are invalid.';

      case 'operation-not-allowed':
        return 'Google Sign-In is not enabled in Firebase.';

      case 'network-request-failed':
        return 'Network error. Please try again.';

      case 'too-many-requests':
        return 'Too many requests. Please try again later.';

      default:
        return error.message ?? 'Authentication failed.';
    }
  }
}