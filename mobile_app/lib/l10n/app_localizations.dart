import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';

class AppLocalizations {
  const AppLocalizations(this.locale);

  final Locale locale;

  static const delegate = _AppLocalizationsDelegate();

  static const supportedLocales = <Locale>[
    Locale('en'),
    Locale('kn'),
    Locale('hi'),
    Locale('ta'),
    Locale('te'),
    Locale('ml'),
    Locale('mr'),
    Locale('bn'),
    Locale('gu'),
  ];

  static AppLocalizations of(BuildContext context) {
    return Localizations.of<AppLocalizations>(context, AppLocalizations) ??
        const AppLocalizations(Locale('en'));
  }

  String text(String key) {
    final language = _translations[locale.languageCode] ?? _translations['en']!;
    return language[key] ?? _translations['en']![key] ?? key;
  }

  static const languageNames = <String, String>{
    'en': 'English',
    'kn': 'ಕನ್ನಡ',
    'hi': 'हिन्दी',
    'ta': 'தமிழ்',
    'te': 'తెలుగు',
    'ml': 'മലയാളം',
    'mr': 'मराठी',
    'bn': 'বাংলা',
    'gu': 'ગુજરાતી',
  };
}

extension LocalizedBuildContext on BuildContext {
  String tr(String key) => AppLocalizations.of(this).text(key);
}

class _AppLocalizationsDelegate
    extends LocalizationsDelegate<AppLocalizations> {
  const _AppLocalizationsDelegate();

  @override
  bool isSupported(Locale locale) => AppLocalizations.supportedLocales.any(
        (supported) => supported.languageCode == locale.languageCode,
      );

  @override
  Future<AppLocalizations> load(Locale locale) =>
      SynchronousFuture(AppLocalizations(locale));

  @override
  bool shouldReload(_AppLocalizationsDelegate old) => false;
}

const _translations = <String, Map<String, String>>{
  'en': {
    'settings': 'Settings', 'preferences': 'Preferences',
    'customizeExperience': 'Customize your RentItEase experience.',
    'notifications': 'Notifications', 'pushNotifications': 'Push Notifications',
    'pushDescription': 'Receive notifications on your device',
    'emailNotifications': 'Email Notifications',
    'emailDescription': 'Receive important updates by email',
    'smsNotifications': 'SMS Notifications',
    'smsDescription': 'Receive important updates by SMS',
    'appearance': 'Appearance', 'darkMode': 'Dark Mode',
    'darkModeDescription': 'Use a dark appearance throughout the app',
    'language': 'Language', 'appLanguage': 'App Language',
    'selectLanguage': 'Select Language', 'contactUs': 'Contact Us',
    'generalEnquiries': 'General enquiries', 'customerSupport': 'Customer support',
    'callUs': 'Call us', 'changePassword': 'Change Password',
    'currentPassword': 'Current Password', 'newPassword': 'New Password',
    'confirmNewPassword': 'Confirm New Password',
    'minimum8Characters': 'Minimum 8 characters', 'cancel': 'Cancel',
    'delete': 'Delete', 'deleteAccount': 'Delete Account',
    'deleteAccountWarning': 'This will permanently delete your account and its data. This action cannot be undone.',
    'fillPasswordFields': 'Please fill all password fields.',
    'passwordMinimum': 'New password must be at least 8 characters.',
    'passwordMismatch': 'New passwords do not match.',
    'passwordChanged': 'Password changed successfully.',
    'accountDeleted': 'Account deleted successfully.', 'retry': 'Retry',
    'home': 'Home', 'search': 'Search', 'favorites': 'Favorites',
    'engagement': 'Engagement', 'analytics': 'Analytics',
    'visits': 'Visits', 'bookings': 'Bookings',
    'profile': 'Profile', 'backAgain': 'Press back again to close RentItEase',
    'rateApp': 'Rate RentItEase', 'experienceQuestion': 'How was your experience?',
    'commentsOptional': 'Comments (optional)', 'later': 'Later', 'submit': 'Submit',
    'unableSaveRating': 'Unable to save rating',
    'website': 'Website', 'security': 'Security', 'account': 'Account',
    'updatePassword': 'Update your account password',
    'deleteAccountDescription': 'Permanently delete your RentItEase account',
    'settingsFooter': 'RentItEase Settings',
    'unableOpenContact': 'Unable to open this contact option.',
    'unableLoadSettings': 'Unable to load settings.',
  },
  'kn': {
    'settings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'preferences': 'ಆದ್ಯತೆಗಳು', 'customizeExperience': 'ನಿಮ್ಮ RentItEase ಅನುಭವವನ್ನು ಹೊಂದಿಸಿ.', 'notifications': 'ಅಧಿಸೂಚನೆಗಳು', 'pushNotifications': 'ಪುಶ್ ಅಧಿಸೂಚನೆಗಳು', 'pushDescription': 'ನಿಮ್ಮ ಸಾಧನದಲ್ಲಿ ಅಧಿಸೂಚನೆಗಳನ್ನು ಸ್ವೀಕರಿಸಿ', 'emailNotifications': 'ಇಮೇಲ್ ಅಧಿಸೂಚನೆಗಳು', 'emailDescription': 'ಪ್ರಮುಖ ನವೀಕರಣಗಳನ್ನು ಇಮೇಲ್ ಮೂಲಕ ಪಡೆಯಿರಿ', 'smsNotifications': 'SMS ಅಧಿಸೂಚನೆಗಳು', 'smsDescription': 'ಪ್ರಮುಖ ನವೀಕರಣಗಳನ್ನು SMS ಮೂಲಕ ಪಡೆಯಿರಿ', 'appearance': 'ಗೋಚರತೆ', 'darkMode': 'ಡಾರ್ಕ್ ಮೋಡ್', 'darkModeDescription': 'ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿ ಗಾಢ ನೋಟ ಬಳಸಿ', 'language': 'ಭಾಷೆ', 'appLanguage': 'ಅಪ್ಲಿಕೇಶನ್ ಭಾಷೆ', 'selectLanguage': 'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', 'contactUs': 'ನಮ್ಮನ್ನು ಸಂಪರ್ಕಿಸಿ', 'generalEnquiries': 'ಸಾಮಾನ್ಯ ವಿಚಾರಣೆಗಳು', 'customerSupport': 'ಗ್ರಾಹಕ ಬೆಂಬಲ', 'callUs': 'ನಮಗೆ ಕರೆ ಮಾಡಿ', 'changePassword': 'ಪಾಸ್‌ವರ್ಡ್ ಬದಲಿಸಿ', 'currentPassword': 'ಪ್ರಸ್ತುತ ಪಾಸ್‌ವರ್ಡ್', 'newPassword': 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್', 'confirmNewPassword': 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ದೃಢೀಕರಿಸಿ', 'minimum8Characters': 'ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳು', 'cancel': 'ರದ್ದುಮಾಡಿ', 'delete': 'ಅಳಿಸಿ', 'deleteAccount': 'ಖಾತೆ ಅಳಿಸಿ', 'deleteAccountWarning': 'ಇದು ನಿಮ್ಮ ಖಾತೆ ಮತ್ತು ಅದರ ಡೇಟಾವನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸುತ್ತದೆ. ಇದನ್ನು ರದ್ದುಗೊಳಿಸಲಾಗುವುದಿಲ್ಲ.', 'fillPasswordFields': 'ಎಲ್ಲಾ ಪಾಸ್‌ವರ್ಡ್ ಕ್ಷೇತ್ರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.', 'passwordMinimum': 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್ ಕನಿಷ್ಠ 8 ಅಕ್ಷರಗಳಿರಬೇಕು.', 'passwordMismatch': 'ಹೊಸ ಪಾಸ್‌ವರ್ಡ್‌ಗಳು ಹೊಂದಿಕೆಯಾಗುವುದಿಲ್ಲ.', 'passwordChanged': 'ಪಾಸ್‌ವರ್ಡ್ ಯಶಸ್ವಿಯಾಗಿ ಬದಲಾಗಿದೆ.', 'accountDeleted': 'ಖಾತೆ ಯಶಸ್ವಿಯಾಗಿ ಅಳಿಸಲಾಗಿದೆ.', 'retry': 'ಮತ್ತೆ ಪ್ರಯತ್ನಿಸಿ', 'home': 'ಮುಖಪುಟ', 'search': 'ಹುಡುಕಾಟ', 'favorites': 'ಮೆಚ್ಚಿನವು', 'engagement': 'ತೊಡಗಿಸಿಕೊಳ್ಳುವಿಕೆ', 'visits': 'ಭೇಟಿಗಳು', 'bookings': 'ಬುಕಿಂಗ್‌ಗಳು', 'profile': 'ಪ್ರೊಫೈಲ್', 'backAgain': 'RentItEase ಮುಚ್ಚಲು ಮತ್ತೆ ಹಿಂದಕ್ಕೆ ಒತ್ತಿರಿ', 'rateApp': 'RentItEase ಮೌಲ್ಯಮಾಪನ ಮಾಡಿ', 'experienceQuestion': 'ನಿಮ್ಮ ಅನುಭವ ಹೇಗಿತ್ತು?', 'commentsOptional': 'ಅಭಿಪ್ರಾಯಗಳು (ಐಚ್ಛಿಕ)', 'later': 'ನಂತರ', 'submit': 'ಸಲ್ಲಿಸಿ', 'unableSaveRating': 'ರೇಟಿಂಗ್ ಉಳಿಸಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ', 'website': 'ವೆಬ್‌ಸೈಟ್', 'security': 'ಭದ್ರತೆ', 'account': 'ಖಾತೆ', 'updatePassword': 'ನಿಮ್ಮ ಖಾತೆಯ ಪಾಸ್‌ವರ್ಡ್ ನವೀಕರಿಸಿ', 'deleteAccountDescription': 'ನಿಮ್ಮ RentItEase ಖಾತೆಯನ್ನು ಶಾಶ್ವತವಾಗಿ ಅಳಿಸಿ', 'settingsFooter': 'RentItEase ಸೆಟ್ಟಿಂಗ್‌ಗಳು', 'unableOpenContact': 'ಈ ಸಂಪರ್ಕ ಆಯ್ಕೆಯನ್ನು ತೆರೆಯಲಾಗಲಿಲ್ಲ.', 'unableLoadSettings': 'ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಲೋಡ್ ಮಾಡಲು ಸಾಧ್ಯವಾಗಲಿಲ್ಲ.',
  },
  'hi': {
    'settings': 'सेटिंग्स', 'preferences': 'प्राथमिकताएँ', 'customizeExperience': 'अपने RentItEase अनुभव को अनुकूलित करें।', 'notifications': 'सूचनाएँ', 'pushNotifications': 'पुश सूचनाएँ', 'pushDescription': 'अपने डिवाइस पर सूचनाएँ प्राप्त करें', 'emailNotifications': 'ईमेल सूचनाएँ', 'emailDescription': 'ईमेल से महत्वपूर्ण अपडेट प्राप्त करें', 'smsNotifications': 'SMS सूचनाएँ', 'smsDescription': 'SMS से महत्वपूर्ण अपडेट प्राप्त करें', 'appearance': 'दिखावट', 'darkMode': 'डार्क मोड', 'darkModeDescription': 'पूरे ऐप में गहरे रंग का उपयोग करें', 'language': 'भाषा', 'appLanguage': 'ऐप की भाषा', 'selectLanguage': 'भाषा चुनें', 'contactUs': 'संपर्क करें', 'generalEnquiries': 'सामान्य पूछताछ', 'customerSupport': 'ग्राहक सहायता', 'callUs': 'हमें कॉल करें', 'changePassword': 'पासवर्ड बदलें', 'currentPassword': 'वर्तमान पासवर्ड', 'newPassword': 'नया पासवर्ड', 'confirmNewPassword': 'नए पासवर्ड की पुष्टि करें', 'minimum8Characters': 'कम से कम 8 अक्षर', 'cancel': 'रद्द करें', 'delete': 'हटाएँ', 'deleteAccount': 'खाता हटाएँ', 'deleteAccountWarning': 'यह आपके खाते और उसके डेटा को स्थायी रूप से हटा देगा। इसे वापस नहीं किया जा सकता।', 'fillPasswordFields': 'कृपया सभी पासवर्ड फ़ील्ड भरें।', 'passwordMinimum': 'नया पासवर्ड कम से कम 8 अक्षरों का होना चाहिए।', 'passwordMismatch': 'नए पासवर्ड मेल नहीं खाते।', 'passwordChanged': 'पासवर्ड सफलतापूर्वक बदल गया।', 'accountDeleted': 'खाता सफलतापूर्वक हटा दिया गया।', 'retry': 'पुनः प्रयास करें', 'home': 'होम', 'search': 'खोजें', 'favorites': 'पसंदीदा', 'engagement': 'सहभागिता', 'visits': 'मुलाकातें', 'bookings': 'बुकिंग', 'profile': 'प्रोफ़ाइल', 'backAgain': 'RentItEase बंद करने के लिए फिर पीछे दबाएँ', 'rateApp': 'RentItEase को रेट करें', 'experienceQuestion': 'आपका अनुभव कैसा रहा?', 'commentsOptional': 'टिप्पणियाँ (वैकल्पिक)', 'later': 'बाद में', 'submit': 'जमा करें', 'unableSaveRating': 'रेटिंग सहेजी नहीं जा सकी',
  },
  'ta': {
    'settings': 'அமைப்புகள்', 'preferences': 'விருப்பங்கள்', 'customizeExperience': 'உங்கள் RentItEase அனுபவத்தைத் தனிப்பயனாக்குங்கள்.', 'notifications': 'அறிவிப்புகள்', 'pushNotifications': 'புஷ் அறிவிப்புகள்', 'pushDescription': 'உங்கள் சாதனத்தில் அறிவிப்புகளைப் பெறுங்கள்', 'emailNotifications': 'மின்னஞ்சல் அறிவிப்புகள்', 'emailDescription': 'முக்கிய புதுப்பிப்புகளை மின்னஞ்சலில் பெறுங்கள்', 'smsNotifications': 'SMS அறிவிப்புகள்', 'smsDescription': 'முக்கிய புதுப்பிப்புகளை SMS-ல் பெறுங்கள்', 'appearance': 'தோற்றம்', 'darkMode': 'இருண்ட பயன்முறை', 'darkModeDescription': 'செயலி முழுவதும் இருண்ட தோற்றத்தைப் பயன்படுத்துங்கள்', 'language': 'மொழி', 'appLanguage': 'செயலி மொழி', 'selectLanguage': 'மொழியைத் தேர்ந்தெடுக்கவும்', 'contactUs': 'தொடர்பு கொள்ளுங்கள்', 'generalEnquiries': 'பொது விசாரணைகள்', 'customerSupport': 'வாடிக்கையாளர் ஆதரவு', 'callUs': 'எங்களை அழைக்கவும்', 'changePassword': 'கடவுச்சொல்லை மாற்று', 'currentPassword': 'தற்போதைய கடவுச்சொல்', 'newPassword': 'புதிய கடவுச்சொல்', 'confirmNewPassword': 'புதிய கடவுச்சொல்லை உறுதிப்படுத்து', 'minimum8Characters': 'குறைந்தது 8 எழுத்துகள்', 'cancel': 'ரத்துசெய்', 'delete': 'நீக்கு', 'deleteAccount': 'கணக்கை நீக்கு', 'retry': 'மீண்டும் முயற்சி', 'home': 'முகப்பு', 'search': 'தேடல்', 'favorites': 'விருப்பங்கள்', 'engagement': 'ஈடுபாடு', 'visits': 'வருகைகள்', 'bookings': 'முன்பதிவுகள்', 'profile': 'சுயவிவரம்', 'later': 'பின்னர்', 'submit': 'சமர்ப்பி',
  },
  'te': {
    'settings': 'సెట్టింగ్‌లు', 'preferences': 'ప్రాధాన్యతలు', 'notifications': 'నోటిఫికేషన్‌లు', 'pushNotifications': 'పుష్ నోటిఫికేషన్‌లు', 'emailNotifications': 'ఇమెయిల్ నోటిఫికేషన్‌లు', 'smsNotifications': 'SMS నోటిఫికేషన్‌లు', 'appearance': 'రూపం', 'darkMode': 'డార్క్ మోడ్', 'language': 'భాష', 'appLanguage': 'యాప్ భాష', 'selectLanguage': 'భాషను ఎంచుకోండి', 'contactUs': 'మమ్మల్ని సంప్రదించండి', 'generalEnquiries': 'సాధారణ విచారణలు', 'customerSupport': 'కస్టమర్ సపోర్ట్', 'callUs': 'మాకు కాల్ చేయండి', 'changePassword': 'పాస్‌వర్డ్ మార్చండి', 'currentPassword': 'ప్రస్తుత పాస్‌వర్డ్', 'newPassword': 'కొత్త పాస్‌వర్డ్', 'confirmNewPassword': 'కొత్త పాస్‌వర్డ్ నిర్ధారించండి', 'cancel': 'రద్దు', 'delete': 'తొలగించు', 'deleteAccount': 'ఖాతాను తొలగించు', 'retry': 'మళ్లీ ప్రయత్నించండి', 'home': 'హోమ్', 'search': 'వెతకండి', 'favorites': 'ఇష్టమైనవి', 'engagement': 'పాల్గొనడం', 'visits': 'సందర్శనలు', 'bookings': 'బుకింగ్‌లు', 'profile': 'ప్రొఫైల్', 'later': 'తర్వాత', 'submit': 'సమర్పించండి',
  },
  'ml': {
    'settings': 'ക്രമീകരണങ്ങൾ', 'preferences': 'മുൻഗണനകൾ', 'notifications': 'അറിയിപ്പുകൾ', 'pushNotifications': 'പുഷ് അറിയിപ്പുകൾ', 'emailNotifications': 'ഇമെയിൽ അറിയിപ്പുകൾ', 'smsNotifications': 'SMS അറിയിപ്പുകൾ', 'appearance': 'രൂപം', 'darkMode': 'ഡാർക്ക് മോഡ്', 'language': 'ഭാഷ', 'appLanguage': 'ആപ്പ് ഭാഷ', 'selectLanguage': 'ഭാഷ തിരഞ്ഞെടുക്കുക', 'contactUs': 'ബന്ധപ്പെടുക', 'generalEnquiries': 'പൊതുവായ അന്വേഷണങ്ങൾ', 'customerSupport': 'ഉപഭോക്തൃ പിന്തുണ', 'callUs': 'ഞങ്ങളെ വിളിക്കുക', 'changePassword': 'പാസ്‌വേഡ് മാറ്റുക', 'currentPassword': 'നിലവിലെ പാസ്‌വേഡ്', 'newPassword': 'പുതിയ പാസ്‌വേഡ്', 'confirmNewPassword': 'പുതിയ പാസ്‌വേഡ് സ്ഥിരീകരിക്കുക', 'cancel': 'റദ്ദാക്കുക', 'delete': 'ഇല്ലാതാക്കുക', 'deleteAccount': 'അക്കൗണ്ട് ഇല്ലാതാക്കുക', 'retry': 'വീണ്ടും ശ്രമിക്കുക', 'home': 'ഹോം', 'search': 'തിരയുക', 'favorites': 'പ്രിയപ്പെട്ടവ', 'engagement': 'ഇടപെടൽ', 'visits': 'സന്ദർശനങ്ങൾ', 'bookings': 'ബുക്കിംഗുകൾ', 'profile': 'പ്രൊഫൈൽ', 'later': 'പിന്നീട്', 'submit': 'സമർപ്പിക്കുക',
  },
  'mr': {
    'settings': 'सेटिंग्ज', 'preferences': 'प्राधान्ये', 'notifications': 'सूचना', 'pushNotifications': 'पुश सूचना', 'emailNotifications': 'ईमेल सूचना', 'smsNotifications': 'SMS सूचना', 'appearance': 'स्वरूप', 'darkMode': 'डार्क मोड', 'language': 'भाषा', 'appLanguage': 'ॲप भाषा', 'selectLanguage': 'भाषा निवडा', 'contactUs': 'संपर्क साधा', 'generalEnquiries': 'सामान्य चौकशी', 'customerSupport': 'ग्राहक सहाय्य', 'callUs': 'आम्हाला कॉल करा', 'changePassword': 'पासवर्ड बदला', 'currentPassword': 'सध्याचा पासवर्ड', 'newPassword': 'नवीन पासवर्ड', 'confirmNewPassword': 'नवीन पासवर्डची पुष्टी करा', 'cancel': 'रद्द करा', 'delete': 'हटवा', 'deleteAccount': 'खाते हटवा', 'retry': 'पुन्हा प्रयत्न करा', 'home': 'मुख्यपृष्ठ', 'search': 'शोधा', 'favorites': 'आवडते', 'engagement': 'सहभाग', 'visits': 'भेटी', 'bookings': 'बुकिंग', 'profile': 'प्रोफाइल', 'later': 'नंतर', 'submit': 'सबमिट करा',
  },
  'bn': {
    'settings': 'সেটিংস', 'preferences': 'পছন্দসমূহ', 'notifications': 'বিজ্ঞপ্তি', 'pushNotifications': 'পুশ বিজ্ঞপ্তি', 'emailNotifications': 'ইমেইল বিজ্ঞপ্তি', 'smsNotifications': 'SMS বিজ্ঞপ্তি', 'appearance': 'চেহারা', 'darkMode': 'ডার্ক মোড', 'language': 'ভাষা', 'appLanguage': 'অ্যাপের ভাষা', 'selectLanguage': 'ভাষা নির্বাচন করুন', 'contactUs': 'যোগাযোগ করুন', 'generalEnquiries': 'সাধারণ জিজ্ঞাসা', 'customerSupport': 'গ্রাহক সহায়তা', 'callUs': 'আমাদের কল করুন', 'changePassword': 'পাসওয়ার্ড পরিবর্তন করুন', 'currentPassword': 'বর্তমান পাসওয়ার্ড', 'newPassword': 'নতুন পাসওয়ার্ড', 'confirmNewPassword': 'নতুন পাসওয়ার্ড নিশ্চিত করুন', 'cancel': 'বাতিল', 'delete': 'মুছুন', 'deleteAccount': 'অ্যাকাউন্ট মুছুন', 'retry': 'আবার চেষ্টা করুন', 'home': 'হোম', 'search': 'খুঁজুন', 'favorites': 'পছন্দের', 'engagement': 'সম্পৃক্ততা', 'visits': 'ভিজিট', 'bookings': 'বুকিং', 'profile': 'প্রোফাইল', 'later': 'পরে', 'submit': 'জমা দিন',
  },
  'gu': {
    'settings': 'સેટિંગ્સ', 'preferences': 'પસંદગીઓ', 'notifications': 'સૂચનાઓ', 'pushNotifications': 'પુશ સૂચનાઓ', 'emailNotifications': 'ઇમેઇલ સૂચનાઓ', 'smsNotifications': 'SMS સૂચનાઓ', 'appearance': 'દેખાવ', 'darkMode': 'ડાર્ક મોડ', 'language': 'ભાષા', 'appLanguage': 'એપની ભાષા', 'selectLanguage': 'ભાષા પસંદ કરો', 'contactUs': 'અમારો સંપર્ક કરો', 'generalEnquiries': 'સામાન્ય પૂછપરછ', 'customerSupport': 'ગ્રાહક સહાય', 'callUs': 'અમને કૉલ કરો', 'changePassword': 'પાસવર્ડ બદલો', 'currentPassword': 'વર્તમાન પાસવર્ડ', 'newPassword': 'નવો પાસવર્ડ', 'confirmNewPassword': 'નવા પાસવર્ડની પુષ્ટિ કરો', 'cancel': 'રદ કરો', 'delete': 'કાઢી નાખો', 'deleteAccount': 'ખાતું કાઢી નાખો', 'retry': 'ફરી પ્રયાસ કરો', 'home': 'હોમ', 'search': 'શોધો', 'favorites': 'મનપસંદ', 'engagement': 'સહભાગિતા', 'visits': 'મુલાકાતો', 'bookings': 'બુકિંગ', 'profile': 'પ્રોફાઇલ', 'later': 'પછી', 'submit': 'સબમિટ કરો',
  },
};
