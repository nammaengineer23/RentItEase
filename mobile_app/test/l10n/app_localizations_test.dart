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
}
