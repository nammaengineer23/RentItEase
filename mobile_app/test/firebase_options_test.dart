import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/firebase_options.dart';

void main() {
  group('Firebase web environment configuration', () {
    test('staging web app points only to the staging Firebase project', () {
      expect(DefaultFirebaseOptions.stagingWeb.projectId, 'rentitease-staging');
      expect(DefaultFirebaseOptions.stagingWeb.appId,
          '1:722173159384:web:f1ebbc027f7318b49eb4ad');
      expect(DefaultFirebaseOptions.stagingWeb.authDomain,
          'rentitease-staging.firebaseapp.com');
      expect(DefaultFirebaseOptions.stagingWeb.storageBucket,
          'rentitease-staging.firebasestorage.app');
    });

    test('production web app remains on the production Firebase project', () {
      expect(DefaultFirebaseOptions.web.projectId, 'rentitease-65e49');
      expect(DefaultFirebaseOptions.web.appId,
          '1:276976121047:web:0407eed33ae718e2152c92');
    });
  });
}
