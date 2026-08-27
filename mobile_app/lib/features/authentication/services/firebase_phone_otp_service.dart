import 'dart:async';

import 'package:firebase_auth/firebase_auth.dart';

class FirebasePhoneOtpService {
  FirebasePhoneOtpService({FirebaseAuth? auth})
    : _auth = auth ?? FirebaseAuth.instance;

  final FirebaseAuth _auth;

  Future<String> verifyPhone({
    required String phoneNumber,
    required Future<String?> Function() requestCode,
  }) async {
    final completer = Completer<String>();

    Future<void> completeWithCredential(
      PhoneAuthCredential credential,
    ) async {
      if (completer.isCompleted) return;
      try {
        final result = await _auth.signInWithCredential(credential);
        final idToken = await result.user?.getIdToken(true);
        if (idToken == null || idToken.isEmpty) {
          throw Exception('Firebase did not return a phone verification token.');
        }
        if (!completer.isCompleted) completer.complete(idToken);
      } catch (error, stackTrace) {
        if (!completer.isCompleted) {
          completer.completeError(error, stackTrace);
        }
      }
    }

    await _auth.verifyPhoneNumber(
      phoneNumber: phoneNumber,
      timeout: const Duration(seconds: 60),
      verificationCompleted: completeWithCredential,
      verificationFailed: (error) {
        if (!completer.isCompleted) completer.completeError(error);
      },
      codeSent: (verificationId, _) async {
        final code = await requestCode();
        if (code == null || code.length != 6) {
          if (!completer.isCompleted) {
            completer.completeError(
              Exception('Phone verification was cancelled.'),
            );
          }
          return;
        }

        await completeWithCredential(
          PhoneAuthProvider.credential(
            verificationId: verificationId,
            smsCode: code,
          ),
        );
      },
      codeAutoRetrievalTimeout: (_) {},
    );

    return completer.future;
  }
}
