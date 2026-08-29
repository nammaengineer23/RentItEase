import 'package:flutter/widgets.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:mobile_app/l10n/app_localizations.dart';

void main() {
  test('all selectable languages are supported', () {
    expect(
      AppLocalizations.supportedLocales.map((locale) => locale.languageCode),
      AppLocalizations.languageNames.keys,
    );
  });

  test('selected language returns translated navigation text', () {
    const expectedHome = <String, String>{
      'en': 'Home',
      'kn': 'ಮುಖಪುಟ',
      'hi': 'होम',
      'ta': 'முகப்பு',
      'te': 'హోమ్',
      'ml': 'ഹോം',
      'mr': 'मुख्यपृष्ठ',
      'bn': 'হোম',
      'gu': 'હોમ',
    };

    for (final entry in expectedHome.entries) {
      final localizations = AppLocalizations(Locale(entry.key));
      expect(localizations.text('home'), entry.value);
    }
  });

  test('unknown translation keys fall back safely', () {
    const localizations = AppLocalizations(Locale('kn'));
    expect(localizations.text('notYetTranslated'), 'notYetTranslated');
  });

  test('Kannada authentication flow has complete priority translations', () {
    const localizations = AppLocalizations(Locale('kn'));
    const keys = <String>[
      'welcomeBack',
      'login',
      'createAccount',
      'forgotPassword',
      'verifyEmail',
      'verifyPhoneNumber',
      'continueWithGoogle',
      'verificationCode',
    ];

    for (final key in keys) {
      expect(localizations.text(key), isNot(key));
      expect(
        localizations.text(key),
        isNot(const AppLocalizations(Locale('en')).text(key)),
      );
    }
  });

  test('other configured languages fall back to English auth text', () {
    const localizations = AppLocalizations(Locale('hi'));
    expect(localizations.text('welcomeBack'), 'Welcome Back');
  });

  test('Kannada tenant discovery flow has priority translations', () {
    const localizations = AppLocalizations(Locale('kn'));
    const keys = <String>[
      'findPerfectHome',
      'searchProperties',
      'filterProperties',
      'myFavorites',
      'bookPropertyVisit',
      'visitDate',
      'ownerContactProtected',
      'chatWithOwner',
    ];

    for (final key in keys) {
      expect(localizations.text(key), isNot(key));
      expect(
        localizations.text(key),
        isNot(const AppLocalizations(Locale('en')).text(key)),
      );
    }
  });
}
